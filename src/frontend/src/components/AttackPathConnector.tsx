interface AttackPathConnectorProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  onClick: (id: string) => void;
}

export default function AttackPathConnector({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  onClick,
}: AttackPathConnectorProps) {
  // Calculate arrow angle
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
  const arrowSize = 10;

  // Shorten the line to not overlap with icons
  const shortenDistance = 24;
  const lineLength = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
  const shortenRatio = (lineLength - shortenDistance) / lineLength;

  const adjustedTargetX = sourceX + (targetX - sourceX) * shortenRatio;
  const adjustedTargetY = sourceY + (targetY - sourceY) * shortenRatio;

  // Arrow head points
  const arrowPoint1X = adjustedTargetX - arrowSize * Math.cos(angle - Math.PI / 6);
  const arrowPoint1Y = adjustedTargetY - arrowSize * Math.sin(angle - Math.PI / 6);
  const arrowPoint2X = adjustedTargetX - arrowSize * Math.cos(angle + Math.PI / 6);
  const arrowPoint2Y = adjustedTargetY - arrowSize * Math.sin(angle + Math.PI / 6);

  return (
    <g
      className="cursor-pointer hover:opacity-70 transition-opacity"
      onClick={(e) => {
        e.stopPropagation();
        onClick(id);
      }}
      style={{ pointerEvents: 'all' }}
    >
      {/* Invisible wider line for easier clicking */}
      <line
        x1={sourceX}
        y1={sourceY}
        x2={adjustedTargetX}
        y2={adjustedTargetY}
        stroke="transparent"
        strokeWidth="12"
      />
      
      {/* Visible line */}
      <line
        x1={sourceX}
        y1={sourceY}
        x2={adjustedTargetX}
        y2={adjustedTargetY}
        stroke="oklch(0.65 0.18 150)"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
      
      {/* Arrow head */}
      <polygon
        points={`${adjustedTargetX},${adjustedTargetY} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
        fill="oklch(0.65 0.18 150)"
      />
    </g>
  );
}
