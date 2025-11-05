import { FC, ReactNode } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { appColors } from '@/theme';

interface CustomPopoverProps {
  children: ReactNode;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  direction?: 'up' | 'down';
  showBackground?: boolean;
}

const CustomPopover: FC<CustomPopoverProps> = ({ 
  children, 
  size = 'sm', 
  direction = 'down', 
  showBackground = true
}) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  
  const backgroundColor = isDark ? appColors.dark.surface : appColors.light.surface;
  const borderColor = isDark ? appColors.dark.border : appColors.light.border;
  
  // size-based padding
  const paddingMap = {
    xxs: 'px-1 py-0',
    xs: 'px-1.5 py-0.5',
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2',
  };
  
  const padding = paddingMap[size];
  
  // size-based arrow dimensions
  const arrowSizeMap = {
    xxs: { border: 4, fill: 3},
    xs: { border: 4, fill: 3 },
    sm: { border: 6, fill: 5 },
    md: { border: 8, fill: 7 },
    lg: { border: 10, fill: 9 },
  };
  
  const arrowSize = arrowSizeMap[size];
  const isUp = direction === 'up';
  
  // shared arrow styles
  const arrowBorderStyle = {
    borderLeftWidth: `${arrowSize.border}px`,
    borderRightWidth: `${arrowSize.border}px`,
  };
  
  const arrowFillStyle = {
    borderLeftWidth: `${arrowSize.fill}px`,
    borderRightWidth: `${arrowSize.fill}px`,
  };
  
  return (
    <div className="relative flex flex-col items-center">
      {/* arrow pointing up (only if direction is up) */}
      {isUp && (
        showBackground ? (
          <>
            <div 
              className="w-0 h-0 border-l-transparent border-r-transparent"
              style={{
                ...arrowBorderStyle,
                borderBottomWidth: `${arrowSize.border}px`,
                borderBottomColor: borderColor,
                marginBottom: `-1px`,
              }}
            />
            <div 
              className="w-0 h-0 border-l-transparent border-r-transparent"
              style={{
                ...arrowFillStyle,
                borderBottomWidth: `${arrowSize.fill}px`,
                borderBottomColor: backgroundColor,
                marginBottom: `-${arrowSize.border - 1}px`,
              }}
            />
          </>
        ) : (
          <div 
            className="w-0 h-0 border-l-transparent border-r-transparent mb-1"
            style={{
              borderLeftWidth: `${arrowSize.fill}px`,
              borderRightWidth: `${arrowSize.fill}px`,
              borderBottomWidth: `${arrowSize.fill}px`,
              borderBottomColor: isDark ? appColors.light.text : appColors.dark.text,
            }}
          />
        )
      )}
      
      {/* popover content */}
      {showBackground ? (
        <div 
          className={`rounded-md shadow-md ${padding}`}
          style={{
            backgroundColor,
            border: `1px solid ${borderColor}`,
          }}
        >
          {children}
        </div>
      ) : (
        <div className={padding}>
          {children}
        </div>
      )}
      
      {/* arrow pointing down (only if direction is down) */}
      {!isUp && (
        showBackground ? (
          <>
            <div 
              className="w-0 h-0 border-l-transparent border-r-transparent"
              style={{
                ...arrowBorderStyle,
                borderTopWidth: `${arrowSize.border}px`,
                borderTopColor: borderColor,
                marginTop: `-1px`,
              }}
            />
            <div 
              className="w-0 h-0 border-l-transparent border-r-transparent"
              style={{
                ...arrowFillStyle,
                borderTopWidth: `${arrowSize.fill}px`,
                borderTopColor: backgroundColor,
                marginTop: `-${arrowSize.border - 1}px`,
              }}
            />
          </>
        ) : (
          <div 
            className="w-0 h-0 border-l-transparent border-r-transparent mt-2"
            style={{
              borderLeftWidth: `${arrowSize.fill}px`,
              borderRightWidth: `${arrowSize.fill}px`,
              borderTopWidth: `${arrowSize.fill}px`,
              borderTopColor: isDark ? appColors.light.text : appColors.dark.text,
            }}
          />
        )
      )}
    </div>
  );
};

export default CustomPopover;
