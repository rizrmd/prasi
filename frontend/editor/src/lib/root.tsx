import { useState, type FC, type ReactElement } from "react";

export const root = {
  page: <></>,
  render: () => {},
};

export const Root = () => {
  const render = useState({})[1];
  root.render = () => render({});

  return root.page;
};
