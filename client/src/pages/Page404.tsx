import { Link as RouterLink } from "react-router-dom";
import Page from "../common/Page";

export default function Page404() {
  return (
    <Page title="404 Page Not Found">
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="container mx-auto px-4">
        <div className="max-w-[480px] mx-auto min-h-screen flex flex-col justify-center items-center text-center py-24">
          <h3 className="text-3xl font-bold mb-4">Sorry, page not found!</h3>
          <p className="text-gray-500 dark:text-gray-400">
            We couldn't find the page you're looking for. Perhaps you've
            mistyped the URL? Be sure to check your spelling.
          </p>
          <div className="py-12">
            <RouterLink
              to="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-base font-medium"
            >
              Go to Home
            </RouterLink>
          </div>
        </div>
      </div>
      </div>
    </Page>
  );
}
