import { FormEvent, useState } from "react";
import { createWarehouse } from "../../../services/api/warehouseService";

interface WarehouseFormState {
  warehouseName: string;
  managerName: string;
  mobile: string;
  email: string;
  password?: string;
  address: string;
  latitude: string;
  longitude: string;
}

const initialFormState: WarehouseFormState = {
  warehouseName: "",
  managerName: "",
  mobile: "",
  email: "",
  password: "",
  address: "",
  latitude: "",
  longitude: "",
};

export default function AdminCreateWarehouse() {
  const [formData, setFormData] = useState<WarehouseFormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const latitude = parseFloat(formData.latitude);
    const longitude = parseFloat(formData.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError("Valid latitude and longitude are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await createWarehouse({
        warehouseName: formData.warehouseName,
        managerName: formData.managerName,
        mobile: formData.mobile,
        email: formData.email,
        password: formData.password || "Warehouse@123",
        address: formData.address,
        latitude,
        longitude,
      });

      if (!response.success) {
        setError(response.message || "Failed to create warehouse.");
        return;
      }

      setSuccessMessage(
        "Warehouse account created successfully."
      );
      setFormData(initialFormState);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create warehouse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-neutral-50 p-6">
      <div className="mx-auto max-w-3xl rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="rounded-t-lg bg-teal-600 px-6 py-4 text-white">
          <h1 className="text-lg font-semibold">Create Warehouse</h1>
          <p className="text-sm text-teal-100">
            Admin onboarding for warehouse accounts
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Warehouse Name"
              value={formData.warehouseName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, warehouseName: e.target.value }))
              }
            />
            <input
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Manager Name"
              value={formData.managerName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, managerName: e.target.value }))
              }
            />
            <input
              required
              maxLength={10}
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
            />
            <input
              required
              type="email"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <input
              type="password"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Password (Default: Warehouse@123)"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
            />
            <input
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
            />
            <input
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, latitude: e.target.value }))
              }
            />
            <input
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, longitude: e.target.value }))
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Warehouse"}
          </button>
        </form>
      </div>
    </div>
  );
}
