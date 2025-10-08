interface ActivationStatusTagProps {
  isActivated: boolean | null;
}

const ActivationStatusTag = ({ isActivated }: ActivationStatusTagProps) => {
  const activated = isActivated === true;
  
  return (
    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
      activated 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      {activated ? 'Activated' : 'Not yet Activated'}
    </div>
  );
};

export default ActivationStatusTag;