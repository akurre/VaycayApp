import { MOBILE_BAR_INSET_PX } from '@/const';

interface MobileDateScrubberProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  hidden?: boolean;
}

// Stub — full persistent scrubber lands in Task 4.
const MobileDateScrubber = ({
  selectedDate,
  hidden = false,
}: MobileDateScrubberProps) => {
  return (
    <div
      className="absolute z-20 flex items-center justify-center"
      style={{
        bottom: MOBILE_BAR_INSET_PX,
        left: MOBILE_BAR_INSET_PX,
        right: MOBILE_BAR_INSET_PX,
        transform: hidden ? 'translateY(120%)' : 'translateY(0)',
        transition: 'transform 250ms ease',
      }}
    >
      <span>DATE: {selectedDate}</span>
    </div>
  );
};

export default MobileDateScrubber;
