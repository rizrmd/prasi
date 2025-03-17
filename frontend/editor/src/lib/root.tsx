import { useState, type FC, type ReactElement } from "react";

export const root = {
  page: <></>,
  render: () => {},
};

export const EditorRoot = () => {
  const render = useState({})[1];
  root.render = () => render({});

  return <div className="bg-blue-200 flex-1">{root.page}</div>;
};
