import { useState, type FC, type ReactElement } from "react";

export const root = {
  page: <>MOKO</>,
  render: () => {},
};

export const EditorRoot = () => {
  const render = useState({})[1];
  root.render = () => render({});

  return (
    <div
      className="bg-amber-200 flex-1"
      onClick={() => {
        navigate("/moko");
      }}
    >
      {root.page}
    </div>
  );
};
