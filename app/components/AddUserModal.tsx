'use client';

import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useData } from "../../lib/DataContextWithAPI";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const { addToDataMatchIt } = useData();
  
  const [formData, setFormData] = useState({
    badge: '',
    naam: '',
    voornaam: '',
    blok: '',
    nationaliteit: '',
    ovNummer: '',
    rijkregisternr: '',
    geboortedatum: '',
    leeftijd: '',
    geslacht: 'Mannelijk',
    referentiepersoon: '',
    datumIn: '',
    dagenVerblijf: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get badge number for default values
    const badgeNumber = parseInt(formData.badge) || 0;
    
    // Apply default values if OV Nummer or Rijkregisternr are empty
    let ovNumber = formData.ovNummer;
    // Check for empty, null, undefined, or whitespace-only values
    if (!ovNumber || ovNumber === '' || ovNumber === null || ovNumber === undefined || 
        (typeof ovNumber === 'string' && ovNumber.trim() === '')) {
      ovNumber = '0000000'; // Seven zeros for empty OV Nummer
      console.log(`Applied default OV Nummer for badge ${badgeNumber}: ${ovNumber}`);
    }
    
    let registerNumber = formData.rijkregisternr;
    // Check for empty, null, undefined, or whitespace-only values
    if (!registerNumber || registerNumber === '' || registerNumber === null || registerNumber === undefined || 
        (typeof registerNumber === 'string' && registerNumber.trim() === '')) {
      registerNumber = `0FICT${badgeNumber}A`; // 0FICT + badge + A for empty Rijkregisternr
      console.log(`Applied default Rijkregisternr for badge ${badgeNumber}: ${registerNumber}`);
    }
    
    const newUser = {
      id: Date.now(),
      badge: badgeNumber,
      name: `${formData.voornaam} ${formData.naam}`.trim(),
      firstName: formData.voornaam,
      lastName: formData.naam,
      block: formData.blok,
      room: formData.blok,
      nationality: formData.nationaliteit,
      ovNumber: ovNumber,
      registerNumber: registerNumber,
      dateOfBirth: formData.geboortedatum,
      age: parseInt(formData.leeftijd) || 0,
      gender: formData.geslacht === 'Mannelijk' ? 'M' : 'V',
      referencePerson: formData.referentiepersoon,
      dateIn: formData.datumIn,
      daysOfStay: parseInt(formData.dagenVerblijf) || 0,
      status: 'active',
      // Default meal time settings for new users
      remarks: '',
      ontbijt: false,
      middag: false,
      snack16: false,
      avond: false,
      snack21: false
    };

    // Add to Data-Match-It (this will automatically update all derived lists)
    console.log('🎯 AddUserModal: About to call addToDataMatchIt with user:', {
      firstName: newUser.firstName,
      lastName: newUser.lastName, 
      badge: newUser.badge
    });
    
    await addToDataMatchIt(newUser);
    
    console.log('🎯 AddUserModal: addToDataMatchIt call completed');
    
    // Reset form
    setFormData({
      badge: '',
      naam: '',
      voornaam: '',
      blok: '',
      nationaliteit: '',
      ovNummer: '',
      rijkregisternr: '',
      geboortedatum: '',
      leeftijd: '',
      geslacht: 'Mannelijk',
      referentiepersoon: '',
      datumIn: '',
      dagenVerblijf: ''
    });
    
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate age if date of birth changes
    if (name === 'geboortedatum' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      const age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      setFormData(prev => ({
        ...prev,
        leeftijd: age.toString()
      }));
    }

    // Auto-calculate days of stay if date in changes
    if (name === 'datumIn' && value) {
      const dateIn = new Date(value);
      const today = new Date();
      const days = Math.floor((today.getTime() - dateIn.getTime()) / (24 * 60 * 60 * 1000));
      // Days start at 1 (same day = 1 day of stay)
      const daysOfStay = days + 1;
      setFormData(prev => ({
        ...prev,
        dagenVerblijf: daysOfStay.toString()
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Nieuwe Gebruiker Toevoegen - Data-Match-It</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Row 1: Badge, Naam, Voornaam */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Badge *
              </label>
              <input
                type="number"
                name="badge"
                value={formData.badge}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Badge nummer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Naam (Achternaam) *
              </label>
              <input
                type="text"
                name="naam"
                value={formData.naam}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Achternaam"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voornaam *
              </label>
              <input
                type="text"
                name="voornaam"
                value={formData.voornaam}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Voornaam"
              />
            </div>
          </div>

          {/* Row 2: Blok, Nationaliteit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blok (Kamer) *
              </label>
              <input
                type="text"
                name="blok"
                value={formData.blok}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Bijv. 2.17"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nationaliteit *
              </label>
              <input
                type="text"
                name="nationaliteit"
                value={formData.nationaliteit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Nationaliteit"
              />
            </div>
          </div>

          {/* Row 3: OV Nummer, Rijkregisternr */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OV Nummer
                <span className="text-xs text-gray-500 ml-1">(leeg = 0000000)</span>
              </label>
              <input
                type="text"
                name="ovNummer"
                value={formData.ovNummer}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Laat leeg voor standaard (0000000)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rijkregisternr
                <span className="text-xs text-gray-500 ml-1">(leeg = 0FICT+badge+A)</span>
              </label>
              <input
                type="text"
                name="rijkregisternr"
                value={formData.rijkregisternr}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Laat leeg voor standaard (0FICT+badge+A)"
              />
            </div>
          </div>

          {/* Row 4: Geboortedatum, Leeftijd, Geslacht */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geboortedatum *
              </label>
              <input
                type="date"
                name="geboortedatum"
                value={formData.geboortedatum}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leeftijd
              </label>
              <input
                type="number"
                name="leeftijd"
                value={formData.leeftijd}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-gray-50"
                placeholder="Auto-berekend"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geslacht *
              </label>
              <select
                name="geslacht"
                value={formData.geslacht}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="Mannelijk">Mannelijk</option>
                <option value="Vrouwelijk">Vrouwelijk</option>
              </select>
            </div>
          </div>

          {/* Row 5: Referentiepersoon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referentiepersoon *
            </label>
            <input
              type="text"
              name="referentiepersoon"
              value={formData.referentiepersoon}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              placeholder="Naam van referentiepersoon"
            />
          </div>

          {/* Row 6: Datum In, Dagen Verblijf */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum In *
              </label>
              <input
                type="date"
                name="datumIn"
                value={formData.datumIn}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dagen Verblijf
              </label>
              <input
                type="number"
                name="dagenVerblijf"
                value={formData.dagenVerblijf}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-gray-50"
                placeholder="Auto-berekend"
                readOnly
              />
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Let op:</strong> 
              <br />• Leeftijd en Dagen Verblijf worden automatisch berekend op basis van de ingevoerde datums.
              <br />• OV Nummer wordt automatisch &apos;0000000&apos; indien leeggelaten.
              <br />• Rijkregisternr wordt automatisch &apos;0FICT&apos; + badge + &apos;A&apos; indien leeggelaten.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Gebruiker Toevoegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}