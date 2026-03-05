import { useNavigate } from "react-router-dom";

export default function WarehouseSignUp() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-cyan-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">
          Warehouse Self Registration Disabled
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Warehouse accounts are now created only by admin. Please contact admin
          to receive your login credentials.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/Warehouse/login")}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Go To Warehouse Login
          </button>
          <button
            onClick={() => navigate("/admin/login")}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}
