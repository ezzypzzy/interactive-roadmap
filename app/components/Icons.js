import React from "react";

export function CheckIcon({ color = "rgb(22, 106, 51)", size = "1.5rem", ...props }) {
  return (
    <svg
      id="Layer_1"
      data-name="Layer 1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      {...props}
    >
      <rect width="24" height="24" fill="none" />
      <path d="M15.33,8.83l-4.85,4.44-1.71-2A1,1,0,1,0,7.23,12.5l2.38,2.85,0,0v0a1,1,0,0,0,.21.14l.13.1a1.06,1.06,0,0,0,.4.08h0a1.07,1.07,0,0,0,.35-.06l.09-.05a1.32,1.32,0,0,0,.2-.12l0,0h0l5.61-5.14a1,1,0,0,0-1.34-1.48Z" />
      <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" />
    </svg>
  );
}
