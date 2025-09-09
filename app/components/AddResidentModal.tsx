'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (residentData: any) => void;
}

export default function AddResidentModal({ isOpen, onClose, onSubmit }: AddResidentModalProps) {
  const [formData, setFormData] = useState({
    badge: '',
    name: '',
    lastName: '',
    room: '',
    nationality: '',
    ovNumber: '',
    registerNumber: '',
    dateOfBirth: '',
    age: '',
    gender: 'M',
    referencePerson: '',
    dateIn: '',
    daysOfStay: '',
    status: 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newResident = {
      id: Date.now(),
      badge: parseInt(formData.badge),
      name: formData.name,
      firstName: '', // Auto-filled from name or left empty
      lastName: formData.lastName,
      block: 'A', // Default block
      room: formData.room,
      nationality: formData.nationality,
      ovNumber: formData.ovNumber,
      registerNumber: formData.registerNumber,
      dateOfBirth: formData.dateOfBirth,
      age: parseInt(formData.age) || 0,
      gender: formData.gender,
      referencePerson: formData.referencePerson,
      dateIn: formData.dateIn,
      daysOfStay: parseInt(formData.daysOfStay) || 0,
      status: formData.status
    };

    onSubmit(newResident);
    setFormData({
      badge: '',
      name: '',
      lastName: '',
      room: '',
      nationality: '',
      ovNumber: '',
      registerNumber: '',
      dateOfBirth: '',
      age: '',
      gender: 'M',
      referencePerson: '',
      dateIn: '',
      daysOfStay: '',
      status: 'active'
    });
    onClose();
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  const calculateDaysOfStay = (dateIn: string) => {
    if (!dateIn) return '';
    const inDate = new Date(dateIn);
    const today = new Date();
    const timeDiff = today.getTime() - inDate.getTime();
    const days = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, days).toString();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updates: any = { [name]: value };

    // Auto-calculate age when date of birth changes
    if (name === 'dateOfBirth') {
      updates.age = calculateAge(value);
    }

    // Auto-calculate days of stay when date in changes
    if (name === 'dateIn') {
      updates.daysOfStay = calculateDaysOfStay(value);
    }

    setFormData({
      ...formData,
      ...updates
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Nieuwe Bewoner Toevoegen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Badge
              </label>
              <input
                type="number"
                name="badge"
                value={formData.badge}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Voer badge nummer in"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Naam
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Voer volledige naam in"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Achternaam
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Voer achternaam in"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kamer
              </label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Voer kamernummer in (bijv. 2.17)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nationaliteit
            </label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Voer nationaliteit in"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OV Nummer
              </label>
              <input
                type="text"
                name="ovNumber"
                value={formData.ovNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Voer OV nummer in"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registratienummer
              </label>
              <input
                type="text"
                name="registerNumber"
                value={formData.registerNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Voer registratienummer in"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geboortedatum
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leeftijd <span className="text-xs text-gray-500">(automatisch berekend)</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-black cursor-not-allowed"
                placeholder="Wordt automatisch berekend uit geboortedatum"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Geslacht
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="M">Man</option>
              <option value="V">Vrouw</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referentiepersoon
            </label>
            <input
              type="text"
              name="referencePerson"
              value={formData.referencePerson}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Voer naam referentiepersoon in"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum Aankomst
              </label>
              <input
                type="date"
                name="dateIn"
                value={formData.dateIn}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dagen Verblijf <span className="text-xs text-gray-500">(automatisch berekend)</span>
              </label>
              <input
                type="number"
                name="daysOfStay"
                value={formData.daysOfStay}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-black cursor-not-allowed"
                placeholder="Wordt automatisch berekend uit datum aankomst"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Bewoner Toevoegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}