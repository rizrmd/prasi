import { useRef, useState } from "react";

export const useLocal = <T>(value: T) => {
  const ref = useRef(value).current;
  const render = useState({})[1];

  (ref as any).render = () => {
    render({});
  };

  return ref as T & { render: () => void };
};
