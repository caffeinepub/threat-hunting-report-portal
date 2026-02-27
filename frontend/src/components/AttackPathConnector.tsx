interface AttackPathConnectorProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  rotation?: number;
  isSelected?: boolean;
  isDotted?: boolean;
  onClick: (id: string) => void;
}

export default function AttackPathConnector({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  rotation = 0,
  isSelected = false,
  isDotted = false,
  onClick,
}: AttackPathConnectorProps) {
  // Calculate arrow angle
  const baseAngle = Math.atan2(targetY - sourceY, targetX - sourceX);
  const angle = baseAngle + (rotation * Math.PI) / 180;
  const arrowSize = 10;

  // Calculate center point for rotation
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  // Calculate line length
  const lineLength = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));

  // Shorten the line to not overlap with icons
  const shortenDistance = 24;
  const shortenRatio = lineLength > 0 ? (lineLength - shortenDistance) / lineLength : 1;

  // Calculate rotated endpoints
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  // Apply rotation around center
  const rotatedDx = dx * Math.cos((rotation * Math.PI) / 180) - dy * Math.sin((rotation * Math.PI) / 180);
  const rotatedDy = dx * Math.sin((rotation * Math.PI) / 180) + dy * Math.cos((rotation * Math.PI) / 180);

  const rotatedTargetX = centerX + rotatedDx / 2;
  const rotatedTargetY = centerY + rotatedDy / 2;
  const rotatedSourceX = centerX - rotatedDx / 2;
  const rotatedSourceY = centerY - rotatedDy / 2;

  // Adjust for shortening
  const adjustedTargetX = rotatedSourceX + (rotatedTargetX - rotatedSourceX) * shortenRatio;
  const adjustedTargetY = rotatedSourceY + (rotatedTargetY - rotatedSourceY) * shortenRatio;

  // Arrow head points
  const arrowPoint1X = adjustedTargetX - arrowSize * Math.cos(angle - Math.PI / 6);
  const arrowPoint1Y = adjustedTargetY - arrowSize * Math.sin(angle - Math.PI / 6);
  const arrowPoint2X = adjustedTargetX - arrowSize * Math.cos(angle + Math.PI / 6);
  const arrowPoint2Y = adjustedTargetY - arrowSize * Math.sin(angle + Math.PI / 6);

  const strokeColor = isSelected
    ? 'oklch(0.55 0.25 250)'
    : isDotted
    ? 'oklch(0.50 0.20 30)'
    : 'oklch(0.65 0.18 150)';
  const strokeWidth = isSelected ? 3 : 2;

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
        x1={rotatedSourceX}
        y1={rotatedSourceY}
        x2={adjustedTargetX}
        y2={adjustedTargetY}
        stroke="transparent"
        strokeWidth="12"
      />

      {/* Visible line */}
      <line
        x1={rotatedSourceX}
        y1={rotatedSourceY}
        x2={adjustedTargetX}
        y2={adjustedTargetY}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={isDotted ? '6,4' : undefined}
        markerEnd="url(#arrowhead)"
      />

      {/* Arrow head */}
      <polygon
        points={`${adjustedTargetX},${adjustedTargetY} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
        fill={strokeColor}
      />

      {/* Selection indicator */}
      {isSelected && (
        <circle
          cx={centerX}
          cy={centerY}
          r="6"
          fill="oklch(0.55 0.25 250)"
          stroke="white"
          strokeWidth="2"
        />
      )}
    </g>
  );
}
