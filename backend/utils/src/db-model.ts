export const storeModelResult = (arg: {
  action: string;
  table: string;
  params: any;
  result: any;
}) => {
  const { action, table, params, result } = arg;
  return;
};

export const modifyQueryParamsToMatchModel = (arg: {
  action: string;
  table: string;
  params: any;
}) => {
  return arg.params;
};
