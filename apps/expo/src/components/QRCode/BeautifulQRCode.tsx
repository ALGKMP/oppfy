"use dom";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface BeautifulQRCodeProps {
  value: string;
  size?: number;
}

const BeautifulQRCode = ({ value, size = 230 }: BeautifulQRCodeProps) => {
  return (
    <div style={{ width: size, height: size }}>
      <QRCodeSVG
        value={value}
        size={size}
        level="Q"
        includeMargin={false}
        imageSettings={{
          src: "/qr-logo.png",
          x: undefined,
          y: undefined,
          height: size * 0.2,
          width: size * 0.2,
          excavate: true,
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
      <style jsx>{`
        div {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Custom QR Code styling */
        :global(svg path:first-of-type) {
          fill: white; /* Background */
        }

        :global(svg path:last-of-type) {
          fill: none;
          stroke: #f214ff;
          stroke-width: 20;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 0 8px rgba(242, 20, 255, 0.3));
        }
      `}</style>
    </div>
  );
};

export default BeautifulQRCode;
