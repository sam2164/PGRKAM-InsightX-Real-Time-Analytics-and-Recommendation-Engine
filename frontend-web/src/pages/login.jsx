export default function Login() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">Login</h1>
      <form className="bg-[#101018] border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full bg-[#181828] border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full bg-[#181828] border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}