import { useState } from "react";
import Page from "../common/Page";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { IoMdClose as CloseIcon } from "react-icons/io";
import { validPassword } from "../utils/password";
import { isEmail } from "../utils/isEmail";

function PrivacyPolicy({ open, setOpen }: { open: any; setOpen: any }) {
  const handleClose = () => setOpen(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-labelledby="customized-dialog-title"
    >
      <div
        className="bg-white rounded-md shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-4 border-b">
          <h2 id="customized-dialog-title" className="text-lg font-semibold">
            Privacy Policy
          </h2>
          <button
            aria-label="close"
            onClick={handleClose}
            className="absolute right-2 top-2 p-1 rounded text-gray-500 hover:bg-gray-100"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="p-4 overflow-y-auto border-b space-y-3 text-sm">
          <p>
            The data you uploaded will not be saved to any local disk without
            your consent. They will only be saved in in-memory databases and
            deleted immediately after use.
          </p>
          <p>
            We will not share any information or data we collect from you with
            any third party businesses or individuals.
          </p>
          <p>
            We may use cookies and similar tracking technologies (like web
            beacons and pixels) to access or store information. Specific
            information about how we use such technologies and how you can
            refuse certain cookies is set out in our Cookie Notice.
          </p>
          <p>
            Our Services offer you the ability to register and log in using your
            third-party social media account details (like your Gmail and Emory
            SSO logins). Where you choose to do this, we will receive certain
            profile information about you from your social media provider. The
            profile information we receive may vary depending on the social
            media provider concerned, but will often include your name, email
            address, friends list, profile picture, as well as other information
            you choose to make public on such a social media platform.
          </p>
        </div>
      </div>
    </div>
  );
}

const termsSections = [
  {
    title: "1. OWNERSHIP OF CONTENT",
    body: "You own the copyright of the content you upload to our Platform. By uploading content, you grant ModelMeetsData a non-exclusive, royalty-free license to use, display, and distribute the content on the Platform.",
  },
  {
    title: "2. USER RESPONSIBILITY",
    body: "You may not upload any content to the Platform that is defamatory, infringing, or illegal. We expect our users to interact with each other in a respectful and professional manner. You may not use the Platform to harass, bully, or threaten other users.",
  },
  {
    title: "3. INTELLECTUAL PROPERTY",
    body: "We respect the intellectual property rights of others and expect our users to do the same. If you believe that your intellectual property rights have been infringed on the Platform, please contact us.",
  },
  {
    title: "4. TERMINATION",
    body: "We may terminate your account and access to the Platform if you violate these Terms or engage in any prohibited activities.",
  },
  {
    title: "5. LIABILITY",
    body: "We are not liable for any damages or legal disputes arising from your use of the Platform. You agree to indemnify and hold us harmless from any claims, damages, or liabilities arising from your use of the Platform.",
  },
  {
    title: "6. MODIFICATIONS",
    body: "We reserve the right to modify these Terms at any time. We will notify you of any changes to these Terms via email or the Platform.",
  },
];

function TermsOfService({ open, setOpen }: { open: any; setOpen: any }) {
  const handleClose = () => setOpen(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-labelledby="customized-dialog-title"
    >
      <div
        className="bg-white rounded-md shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-4 border-b">
          <h2 id="customized-dialog-title" className="text-lg font-semibold">
            Terms of service
          </h2>
          <button
            aria-label="close"
            onClick={handleClose}
            className="absolute right-2 top-2 p-1 rounded text-gray-500 hover:bg-gray-100"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="p-4 overflow-y-auto border-b space-y-3 text-sm">
          <p>
            Welcome to ModelMeetsData web application! These terms of service
            govern your access to and use of our platform. By accessing or using
            the M2D web application, you agree to these Terms.
          </p>
          {termsSections.map((s) => (
            <div key={s.title}>
              <p className="font-bold">{s.title}</p>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500";

const pwdAlert = `Password incorrect. Please ensure that your password:
Contains at least one uppercase letter;
Contains at least one lowercase letter;
Contains at least one digit;
Contains at least one special character ($@,_.?!#*);
Is between 8 and 20 characters in length.`;

const emailAlert = "This doesn't look like an email address to me.";

function Signup(props: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [termsOfServiceOpen, setTermsOfServiceOpen] = useState(false);

  const navigate = useNavigate();

  const handleFirstnameChange = (e: any) => {
    if (message === "Please complete the form!" && !firstName) setMessage("");
    setFirstName(e.target.value);
  };
  const handleLastnameChange = (e: any) => {
    if (message === "Please complete the form!" && !lastName) setMessage("");
    setLastName(e.target.value);
  };
  const handleEmailChange = (e: any) => {
    if ((message === "Please complete the form!" && !email) || message === emailAlert) setMessage("");
    setEmail(e.target.value);
  };
  const handlePasswordChange = (e: any) => {
    if (message === "Please complete the form!" && !password) setMessage("");
    if (message === pwdAlert) setMessage("");
    setPassword(e.target.value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      setMessage("Please complete the form!");
      return;
    }
    if (!isEmail(email)) {
      setMessage(emailAlert);
      return;
    }
    if (!validPassword(password)) {
      setMessage(pwdAlert);
      return;
    }

    const newUser: any = {
      firstName,
      lastName,
      username: email,
      email,
      password,
      loginType: "local",
      isBot: 0,
    };

    fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newUser),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.message === "success") {
          newUser.featureUsers = {};
          newUser.id = result.user.id;
          props.login(result.user || newUser);
          let count = 3;
          setMessage(`Successfully signed up! Relocating in ${count} seconds...`);
          const interval = setInterval(() => {
            count -= 1;
            if (count > 0) {
              setMessage(`Successfully signed up! Relocating in ${count} seconds...`);
            } else {
              clearInterval(interval);
              navigate("/feature");
            }
          }, 1000);
        } else {
          setMessage(result.message);
        }
      })
      .catch((err) => {
        console.error(err);
        setMessage(err.message);
      });
  };

  return (
    <Page title="Signup">
      <div className="md:flex min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="max-w-screen-sm mx-auto w-full px-4">
          <div className="max-w-[480px] mx-auto min-h-screen flex flex-col justify-center">
            <h4 className="text-2xl font-bold mb-2">
              Get started with {import.meta.env.VITE_APP_NAME} Apps.
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Absolutely free in the name of science.</p>

            <form noValidate onSubmit={handleSubmit} className="space-y-3">
              <div className="flex flex-row gap-4">
                <input
                  className={inputClass}
                  id="firstname"
                  name="firstname"
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                  autoFocus
                  value={firstName}
                  onChange={handleFirstnameChange}
                />
                <input
                  className={inputClass}
                  id="lastname"
                  name="lastname"
                  placeholder="Last name"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={handleLastnameChange}
                />
              </div>
              <input
                className={inputClass}
                id="email"
                name="email"
                type="email"
                placeholder="Email Address"
                autoComplete="email"
                required
                value={email}
                onChange={handleEmailChange}
              />
              <input
                className={inputClass}
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="new-password"
                required
                value={password}
                onChange={handlePasswordChange}
              />

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-2">
                By signing up, I agree to {import.meta.env.VITE_APP_NAME} Apps&nbsp;
                <button
                  type="button"
                  className="underline text-black dark:text-white"
                  onClick={() => setTermsOfServiceOpen(true)}
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="underline text-black dark:text-white"
                  onClick={() => setPrivacyPolicyOpen(true)}
                >
                  Privacy Policy
                </button>
                .
              </p>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                Sign Up
              </button>
            </form>

            {message && <p className="mt-2 text-sm whitespace-pre-line">{message}</p>}
            <p className="text-sm mt-6 text-right">
              Already have an account?{" "}
              <RouterLink to="/signin" className="font-medium text-blue-600 hover:underline">
                Sign in
              </RouterLink>
            </p>
          </div>
        </div>
      </div>

      <PrivacyPolicy open={privacyPolicyOpen} setOpen={setPrivacyPolicyOpen} />
      <TermsOfService open={termsOfServiceOpen} setOpen={setTermsOfServiceOpen} />
    </Page>
  );
}

export default Signup;
