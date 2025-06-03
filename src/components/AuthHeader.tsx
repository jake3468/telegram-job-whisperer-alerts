
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';

const AuthHeader = () => {
  return (
    <header className="absolute top-0 right-0 p-6 z-10">
      <SignedOut>
        <div className="flex space-x-4">
          <SignInButton mode="modal">
            <button className="text-white hover:text-gray-300 transition-colors duration-200 font-inter text-sm">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-inter text-sm font-medium">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </SignedOut>
      <SignedIn>
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-8 h-8"
            }
          }}
        />
      </SignedIn>
    </header>
  );
};

export default AuthHeader;
