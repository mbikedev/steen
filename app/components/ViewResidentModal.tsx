'use client';

import { X } from 'lucide-react';

interface ViewResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: any;
}

export default function ViewResidentModal({ isOpen, onClose, resident }: ViewResidentModalProps) {
  if (!isOpen || !resident) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-hidden border border-border shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-card-foreground">Bewoner Details</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Badge
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.badge}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Naam
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.name}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Voornaam
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.firstName}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Achternaam
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.lastName || 'N/A'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Blok
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.block}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Kamer
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.room}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nationaliteit
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
              {resident.nationality}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                OV Nummer
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.ovNumber}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Registratienummer
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.registerNumber}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Geboortedatum
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.dateOfBirth}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Leeftijd
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.age} jaar
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Geslacht
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
              {resident.gender === 'M' ? 'Man' : 'Vrouw'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referentiepersoon
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
              {resident.referencePerson}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Datum Aankomst
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.dateIn}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Dagen Verblijf
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground">
                {resident.daysOfStay} dagen
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-accent text-accent-foreground">
                {resident.status}
              </span>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}