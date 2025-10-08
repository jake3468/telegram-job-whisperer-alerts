interface ActivationStatusTagProps {
  isActivated: boolean | null;
}

const ActivationStatusTag = ({ isActivated }: ActivationStatusTagProps) => {
  const activated = isActivated === true;
  
  return (
    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium z-10 ${
      activated 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      {activated ? 'Activated' : 'Not yet Activated'}
    </div>
  );
};

export default ActivationStatusTag;