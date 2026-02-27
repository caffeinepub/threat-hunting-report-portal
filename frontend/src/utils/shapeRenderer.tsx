import React from 'react';
import { CanvasShape } from '../hooks/useCanvasState';

export function drawShape(shape: CanvasShape): React.ReactElement {
  const { shapeType, x, y, width, height, strokeColor, fillColor, strokeWidth } = shape;

  const commonProps = {
    stroke: strokeColor,
    strokeWidth,
    fill: fillColor,
  };

  switch (shapeType) {
    case 'rectangle':
      return (
        <rect
          key={shape.id}
          x={x}
          y={y}
          width={width}
          height={height}
          {...commonProps}
        />
      );

    case 'circle': {
      const cx = x + width / 2;
      const cy = y + height / 2;
      const rx = width / 2;
      const ry = height / 2;
      return (
        <ellipse
          key={shape.id}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          {...commonProps}
        />
      );
    }

    case 'triangle': {
      const points = `${x + width / 2},${y} ${x + width},${y + height} ${x},${y + height}`;
      return (
        <polygon
          key={shape.id}
          points={points}
          {...commonProps}
        />
      );
    }

    case 'line':
      return (
        <line
          key={shape.id}
          x1={x}
          y1={y + height / 2}
          x2={x + width}
          y2={y + height / 2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
      );

    case 'arrow': {
      const arrowHeadSize = Math.min(width * 0.2, 20);
      const x2 = x + width;
      const y2 = y + height / 2;
      const x1 = x;
      const y1 = y + height / 2;
      return (
        <g key={shape.id}>
          <defs>
            <marker
              id={`arrowhead-${shape.id}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={strokeColor}
              />
            </marker>
          </defs>
          <line
            x1={x1}
            y1={y1}
            x2={x2 - arrowHeadSize * 0.5}
            y2={y2}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            markerEnd={`url(#arrowhead-${shape.id})`}
          />
        </g>
      );
    }

    case 'star': {
      const cx = x + width / 2;
      const cy = y + height / 2;
      const outerR = Math.min(width, height) / 2;
      const innerR = outerR * 0.4;
      const numPoints = 5;
      const pts: string[] = [];
      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (i * Math.PI) / numPoints - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return (
        <polygon
          key={shape.id}
          points={pts.join(' ')}
          {...commonProps}
        />
      );
    }

    case 'diamond': {
      const cx = x + width / 2;
      const cy = y + height / 2;
      const points = `${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`;
      return (
        <polygon
          key={shape.id}
          points={points}
          {...commonProps}
        />
      );
    }

    case 'hexagon': {
      const cx = x + width / 2;
      const cy = y + height / 2;
      const rx = width / 2;
      const ry = height / 2;
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        pts.push(`${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`);
      }
      return (
        <polygon
          key={shape.id}
          points={pts.join(' ')}
          {...commonProps}
        />
      );
    }

    default:
      return (
        <rect
          key={shape.id}
          x={x}
          y={y}
          width={width}
          height={height}
          {...commonProps}
        />
      );
  }
}
