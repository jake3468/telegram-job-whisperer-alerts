
import { BadgeDollarSign } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";

const CreditBalanceDisplay = () => {
  const { data, isLoading } = useUserCredits();

  if (isLoading) return (
    <div className="flex items-center gap-2 text-fuchsia-200 font-orbitron text-xs">
      <BadgeDollarSign className="w-5 h-5 animate-pulse" />
      Loading...
    </div>
  );
  if (!data) return null;
  return (
    <div className="flex items-center gap-2 text-fuchsia-200 font-orbitron text-sm px-2">
      <BadgeDollarSign className="w-5 h-5" />
      <span>{Number(data.current_balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} credits</span>
    </div>
  );
};
export default CreditBalanceDisplay;
