import type { CSSProperties } from "react";
const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  search: "m16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  leaf: "M4 20c1-8 7-9 12-13M4 16C-1 3 15 5 21 2c1 12-4 19-14 16",
  shield: "m12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5l8-3Zm-4 9 3 3 5-6",
  swap: "M4 7h16l-4-4M20 17H4l4 4",
  up: "m6 15 6-6 6 6",
  down: "m6 9 6 6 6-6",
  bag: "M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2",
  info: "M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  car: "m5 6-3 9v5h3v-3h14v3h3v-5l-3-9H5ZM3 13h18M6 15h1m10 0h1",
  save: "M4 3h13l4 4v14H3V3h1Zm3 0v6h10V3M7 21v-8h10v8",
  print: "M6 9V2h12v7M6 17H2V9h20v8h-4M6 14h12v8H6z",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  lock: "M5 10h14v12H5zM8 10V6a4 4 0 0 1 8 0v4",
  tree: "m12 2-7 9h4l-6 7h18l-6-7h4L12 2Zm0 16v4",
  cup: "M4 4h13v10a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V4Zm13 1h2a3 3 0 0 1 0 6h-2M2 22h18",
  fork: "M4 2v7a3 3 0 0 0 6 0V2M7 2v20M18 2c-4 4-4 10 0 10V2Zm0 10v10",
  undo: "M3 10h11a7 7 0 0 1 0 14M3 10l6-6M3 10l6 6",
};
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: keyof typeof paths | "paw";
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {name === "paw" ? (
        <g fill="currentColor" stroke="none">
          <ellipse
            cx="5"
            cy="8"
            rx="2.6"
            ry="3.3"
            transform="rotate(-25 5 8)"
          />
          <ellipse cx="10" cy="4.5" rx="2.5" ry="3.2" />
          <ellipse
            cx="16"
            cy="5"
            rx="2.5"
            ry="3.2"
            transform="rotate(15 16 5)"
          />
          <ellipse
            cx="21"
            cy="10"
            rx="2.4"
            ry="3"
            transform="rotate(30 21 10)"
          />
          <path d="M5 17c0-3 3-4 5-7 1-2 4-2 5 0 1 2 5 4 5 7 0 5-5 3-8 3S5 22 5 17Z" />
        </g>
      ) : (
        <path d={paths[name]} />
      )}
    </svg>
  );
}
