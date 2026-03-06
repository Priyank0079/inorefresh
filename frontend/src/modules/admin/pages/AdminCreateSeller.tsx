import { FormEvent, useState } from "react";
import { createWarehouse } from "../../../services/api/warehouseService";

interface WarehouseFormState {
  warehouseName: string;
  managerName: string;
  mobile: string;
  email: string;
  password?: string;
  address: string;
  location: string;
}

const initialFormState: WarehouseFormState = {
  warehouseName: "",
  managerName: "",
  mobile: "",
  email: "",
  password: "",
  address: "",
  location: "",
};

export default function AdminCreateWarehouse() {
  const [formData, setFormData] = useState<WarehouseFormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [geoCoordinates, setGeoCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleUseCurrentLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setGeoCoordinates({
          latitude,
          longitude,
        });
        setFormData((prev) => ({
          ...prev,
          location: `Current location selected (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
        }));
      },
      () => {
        setError("Unable to get current location. Please enter location manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    // Backend still requires coordinates. If user does not pick current location,
    // use India center coordinates as fallback.
    let latitude = 20.5937;
    let longitude = 78.9629;

    if (geoCoordinates) {
      latitude = geoCoordinates.latitude;
      longitude = geoCoordinates.longitude;
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

      setSuccessMessage("Warehouse account created successfully.");
      setFormData(initialFormState);
      setGeoCoordinates(null);
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
          <p className="text-sm text-teal-100">Admin onboarding for warehouse accounts</p>
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
              onChange={(e) => setFormData((prev) => ({ ...prev, warehouseName: e.target.value }))}
            />
            <input
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Manager Name"
              value={formData.managerName}
              onChange={(e) => setFormData((prev) => ({ ...prev, managerName: e.target.value }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              type="password"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Password (Default: Warehouse@123)"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            />
            <input
              required
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            />

            <div className="relative md:col-span-2">
              <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] font-semibold text-teal-700">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                IN
              </span>
              <input
                required
                className="w-full rounded border border-neutral-300 py-2 pl-14 pr-3 text-sm"
                placeholder="Location (India)"
                value={formData.location}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, location: value }));

                  // Optional: allow manual "lat,lng" input in location field.
                  const match = value.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
                  if (match) {
                    const lat = Number(match[1]);
                    const lng = Number(match[3]);
                    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                      setGeoCoordinates({ latitude: lat, longitude: lng });
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="rounded border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
            >
              Use Current Location
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Warehouse"}
            </button>
          </div>

          {geoCoordinates && (
            <div className="rounded-lg border border-neutral-200 p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-neutral-600">
                <span>
                  Map Preview: {geoCoordinates.latitude.toFixed(6)}, {geoCoordinates.longitude.toFixed(6)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${geoCoordinates.latitude},${geoCoordinates.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 hover:text-teal-800"
                >
                  Open in Maps
                </a>
              </div>
              <iframe
                title="Warehouse location map"
                src={`https://www.google.com/maps?q=${geoCoordinates.latitude},${geoCoordinates.longitude}&z=14&output=embed`}
                className="h-56 w-full rounded border border-neutral-200"
                loading="lazy"
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
