import { Suspense, useState, type FC } from "react";
import { router, type Router } from "base/site/router";
import { ErrorBox } from "./utils/error-box";
import { ViRoot } from "./vi/vi-root";
import { viRead } from "./vi/vi-state";

export const PrasiRoot: FC<{ router: Router }> = () => {
  const vi = viRead();
  const render = useState({})[1];
  router.render = () => {
    setTimeout(() => {
      if (window.viWrite) {
        render({});
      }
    });
  };

  if (router.page) {
    if (window.viWrite.mode !== router.page.responsive) {
      window.viWrite.mode = router.page.responsive;
    }
  }

  return (
    <div className="relative flex flex-1 items-center justify-center w-full h-full">
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
        <ErrorBox>
          <Suspense>{vi.mode && router.page && <ViRoot />}</Suspense>
        </ErrorBox>
      </div>
    </div>
  );
};
