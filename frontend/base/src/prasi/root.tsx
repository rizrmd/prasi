import { Suspense, type FC } from "react";
import { router, type Router } from "src/site/router";
import { ErrorBox } from "./utils/error-box";
import { ViRoot } from "./vi/vi-root";
import { viRead, write } from "./vi/vi-state";

export const PrasiRoot: FC<{ router: Router }> = () => {
  const vi = viRead();

  if (write.mode !== router.page!.responsive) {
    write.mode = router.page!.responsive;
  }

  return (
    <ErrorBox>
      <Suspense>
        <div className="relative flex flex-1 items-center justify-center">
          <div
            className={cx(
              "absolute flex flex-col items-stretch flex-1 bg-white main-content-preview",
              vi.mode === "mobile"
                ? css`
                    @media (min-width: 1280px) {
                      border-left: 1px solid #ccc;
                      border-right: 1px solid #ccc;
                      width: 375px;
                      top: 0px;
                      overflow-x: hidden;
                      overflow-y: auto;
                      bottom: 0px;
                      contain: strict;
                    }
                    @media (max-width: 1279px) {
                      left: 0px;
                      right: 0px;
                      top: 0px;
                      bottom: 0px;
                      overflow-y: auto;
                    }
                  `
                : "inset-0 overflow-auto"
            )}
          >
            <ViRoot />
          </div>
        </div>
      </Suspense>
    </ErrorBox>
  );
};
