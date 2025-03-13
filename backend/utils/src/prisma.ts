import { Prisma, type PrismaClient } from "db/use";

type ModelName = Prisma.ModelName;
type HasManyRecord<T extends ModelName> = {
  [K in T]?: Prisma.TypeMap["model"][K]["payload"][];
};

type BelongsToRecord<T extends ModelName> = {
  [K in T]?: Prisma.TypeMap["model"][K]["payload"];
};

const hasDeletedAt = (models: ReadonlyArray<Prisma.DMMF.Model>, modelName: string): boolean => {
  const model = models.find(
    (m) => m.name.toLowerCase() === modelName.toLowerCase()
  );
  return model?.fields.some((f) => f.name === "deleted_at") ?? false;
};

interface RelationData {
  [key: string]: Record<string, any> | Array<Record<string, any>>;
}

interface ExtendedPrismaModel {
  findMany: (args: any) => Promise<any[]>;
  findFirst: (args: any) => Promise<any | null>;
  update: (args: any) => Promise<any>;
  updateMany: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
}

type RelationHandlerParams = {
  key: string;
  value: Record<string, any> | Array<Record<string, any>>;
  relationPK: string;
  txModel: ExtendedPrismaModel;
  relatedModel: ExtendedPrismaModel;
  record: Record<string, any>;
  models: ReadonlyArray<Prisma.DMMF.Model>;
  modelName: string;
  primaryField: { name: string };
};

export const enhancePrisma = (client: PrismaClient) => {
  return client.$extends({
    name: "save",
    model: {
      $allModels: {
        async save<T>(
          data: Partial<Prisma.Args<T, "createMany">["data"]> &
            Omit<
              Record<string, Record<string, any> | Record<string, any>[]>,
              keyof Prisma.Args<T, "createMany">["data"]
            >
        ) {
          const context = Prisma.getExtensionContext(this);

          if (!context.$name) throw new Error("Model name is required");
          const modelName = context.$name.toLowerCase();
          const prisma = context.$parent as PrismaClient;

          // Get model metadata
          const models = Prisma.dmmf.datamodel.models;
          const modelDMMF = models.find(
            (m) => m.name.toLowerCase() === modelName
          );
          if (!modelDMMF)
            throw new Error(`Model ${modelName} not found in schema`);

          const primaryField = modelDMMF.fields.find((f) => f.isId);
          if (!primaryField)
            throw new Error(`No primary key found for model ${modelName}`);

          const id = (data as any)[primaryField.name];

          // Helper to get primary key for any model
          const getPrimaryKeyForModel = (modelName: string) => {
            const model = models.find(
              (m) => m.name.toLowerCase() === modelName.toLowerCase()
            );
            if (!model)
              throw new Error(`Model ${modelName} not found in schema`);
            const pk = model.fields.find((f) => f.isId);
            if (!pk)
              throw new Error(`No primary key found for model ${modelName}`);
            return pk.name;
          };

          // Extract relation data
          const relationData: Record<string, any> = {};
          const modelData: Record<string, any> = {};

          for (const [key, value] of Object.entries(data)) {
            if (value && typeof value === "object") {
              relationData[key] = value;
            } else {
              modelData[key] = value;
            }
          }

          // Create or update main record
          type AnyModel = {
            create: (args: any) => Promise<any>;
            update: (args: any) => Promise<any>;
          };

          const model = prisma[
            modelName as keyof typeof prisma
          ] as unknown as AnyModel;
          const mainOperation = id
            ? model.update({
                where: { [primaryField.name]: id },
                data: modelData,
              })
            : model.create({
                data: modelData,
              });

          // Wrap everything in a transaction
          return prisma.$transaction(async (tx) => {
            // Use transaction client
            const txModel = tx[modelName as keyof typeof tx] as unknown as AnyModel;
            
            const record = await (id
              ? txModel.update({
                  where: { [primaryField.name]: id },
                  data: modelData,
                })
              : txModel.create({
                  data: modelData,
                }));

            const handleHasManyRelation = async (
              key: string,
              value: any[],
              relationPK: string,
              txModel: ExtendedPrismaModel,
              relatedModel: ExtendedPrismaModel,
              record: any,
              models: ReadonlyArray<Prisma.DMMF.Model>,
              modelName: string,
              primaryField: { name: string }
            ) => {
              const existing = await relatedModel.findMany({
                where: {
                  [modelName.toLowerCase()]: {
                    [primaryField.name]: record[primaryField.name],
                  },
                },
              });

              const existingIds = existing.map((e) => e[relationPK]);
              const newIds = value
                .filter((v) => v[relationPK])
                .map((v) => v[relationPK]);

              const idsToRemove = existingIds.filter((id) => !newIds.includes(id));

              if (idsToRemove.length > 0) {
                if (hasDeletedAt(models, key)) {
                  await relatedModel.updateMany({
                    where: {
                      [relationPK]: { in: idsToRemove },
                      [modelName.toLowerCase()]: {
                        [primaryField.name]: record[primaryField.name],
                      },
                    },
                    data: { deleted_at: new Date() },
                  });
                } else {
                  await txModel.update({
                    where: { [primaryField.name]: record[primaryField.name] },
                    data: {
                      [key]: {
                        disconnect: idsToRemove.map((id) => ({
                          [relationPK]: id,
                        })),
                      },
                    },
                  });
                }
              }

              const connects = value
                .filter((v) => v[relationPK])
                .map((v) => ({ [relationPK]: v[relationPK] }));

              const creates = value
                .filter((v) => !v[relationPK])
                .map((v) => {
                  const { [relationPK]: _, ...data } = v;
                  return data;
                });

              if (connects.length > 0 || creates.length > 0) {
                await txModel.update({
                  where: { [primaryField.name]: record[primaryField.name] },
                  data: {
                    [key]: {
                      connect: connects,
                      create: creates,
                    },
                  },
                });
              }
            };

            const handleBelongsToRelation = async (
              key: string,
              value: Record<string, any>,
              relationPK: string,
              txModel: ExtendedPrismaModel,
              relatedModel: ExtendedPrismaModel,
              record: any,
              models: ReadonlyArray<Prisma.DMMF.Model>,
              modelName: string,
              primaryField: { name: string }
            ) => {
              const existing = await relatedModel.findFirst({
                where: {
                  [modelName.toLowerCase()]: {
                    [primaryField.name]: record[primaryField.name],
                  },
                },
              });

              if (existing && value[relationPK] !== existing[relationPK]) {
                if (hasDeletedAt(models, key)) {
                  await relatedModel.update({
                    where: { [relationPK]: existing[relationPK] },
                    data: { deleted_at: new Date() },
                  });
                }
              }

              if (value[relationPK]) {
                await txModel.update({
                  where: { [primaryField.name]: record[primaryField.name] },
                  data: {
                    [key]: {
                      connect: { [relationPK]: value[relationPK] },
                    },
                  },
                });
              } else {
                const { [relationPK]: _, ...data } = value;
                await txModel.update({
                  where: { [primaryField.name]: record[primaryField.name] },
                  data: {
                    [key]: {
                      create: data,
                    },
                  },
                });
              }
            };

            // Handle all relations
            await Promise.all(
              Object.entries(relationData).map(async ([key, value]) => {
                if (!value) return;

                const relationPK = getPrimaryKeyForModel(key);
                const relatedModel = tx[key.toLowerCase() as keyof typeof tx] as unknown as ExtendedPrismaModel;
                if (!relatedModel) {
                  throw new Error(`Related model ${key} not found`);
                }

                if (Array.isArray(value)) {
                  await handleHasManyRelation(
                    key,
                    value,
                    relationPK,
                    txModel as ExtendedPrismaModel,
                    relatedModel,
                    record,
                    models,
                    modelName,
                    primaryField
                  );
                } else if (typeof value === "object") {
                  await handleBelongsToRelation(
                    key,
                    value,
                    relationPK,
                    txModel as ExtendedPrismaModel,
                    relatedModel,
                    record,
                    models,
                    modelName,
                    primaryField
                  );
                }
              })
            );

            return record;
          });
        },
      },
    },
  });
};

export type PrismaEnhanced = ReturnType<typeof enhancePrisma>;
