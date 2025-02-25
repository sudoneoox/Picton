
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ErrorCodes = ({ statuscode }) => {
  const navigate = useNavigate();

  let message;
  switch (statuscode) {
    case 404:
      message = "Looks like you've ventured into the unknown digital realm.";
      break;
    case 401:
      message = "You are not authorized to view this resource."
      break;
    case 202:
      message = "This page is currently not implemented, but check back soon!"
      break;
    default:
      message = "An unexpected error has occurred.";
  }

  const navigateBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="flex items-center min-h-screen px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="w-full space-y-6 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl animate-bounce">{statuscode}</h1>
          <p className="text-gray-500">{message}</p>
        </div>
        <Button
          className="inline-flex h-10 items-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
          onClick={navigateBackToHome}
        >
          Return to website
        </Button>
      </div>
    </div>
  );
};

export default ErrorCodes;

