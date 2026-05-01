import React from 'react';
import PageTitle from '../../components/common/PageTitle';

const ProfileSettings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageTitle 
        title="Profile Settings" 
        subtitle="Manage your port company profile and contact information"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-teal-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-xl">
                VP
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-500 hover:text-teal-600 transition-all">
                <span className="material-icons-outlined text-lg">photo_camera</span>
              </button>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">Veraval Port Hub</h3>
            <p className="text-sm text-slate-500">Port Administrator</p>
            <div className="mt-6 w-full pt-6 border-t border-slate-50 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Verification Status</span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <span className="material-icons-outlined text-sm">verified</span>
                  Verified
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[100%]"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Company Information</h3>
            </div>
            <form className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                  <input type="text" defaultValue="Veraval Port Hub Pvt Ltd" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input type="email" defaultValue="admin@veravalport.com" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                  <input type="text" defaultValue="+91 98765 43210" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Port Location</label>
                  <select className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all">
                    <option>Veraval Port</option>
                    <option>Mangrol Port</option>
                    <option>Porbandar Port</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Complete Address</label>
                <textarea rows="3" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all">Plot 42, Main Dock Area, Veraval, Gujarat - 362265</textarea>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="px-8 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
