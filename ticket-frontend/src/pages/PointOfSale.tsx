import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
export function PointOfSale() {
  const navigate = useNavigate();
  const {
    individualTickets,
    currentUser,
    markTicketAsUsed
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  // Show tickets based on user role
  const myTickets = useMemo(() => {
    if (currentUser?.role === 'supplier') {
      // Suppliers see tickets they originally issued
      return individualTickets.filter(t => t.originalSupplierId === currentUser?.id);
    } else if (currentUser?.role === 'distributor') {
      // Distributors see tickets they currently own
      return individualTickets.filter(t => t.currentOwnerId === currentUser?.id);
    }
    return [];
  }, [individualTickets, currentUser]);
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return myTickets.filter(t => t.individualTicketId.toLowerCase().includes(query) || t.ticketName.toLowerCase().includes(query) || t.venue.toLowerCase().includes(query));
  }, [searchQuery, myTickets]);
  const handleValidateTicket = (ticket: any) => {
    setSelectedTicket(ticket);
  };
  const handleMarkAsUsed = () => {
    if (selectedTicket) {
      markTicketAsUsed(selectedTicket.individualTicketId);
      setSelectedTicket(null);
      setSearchQuery('');
    }
  };
  const handleBack = () => {
    if (currentUser?.role === 'supplier') {
      navigate('/supplier/dashboard');
    } else {
      navigate('/distributor/dashboard');
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'purchased':
        return 'bg-green-100 text-green-800';
      case 'available_for_resale':
        return 'bg-blue-100 text-blue-800';
      case 'used':
        return 'bg-neutral-200 text-neutral-600';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'purchased':
        return 'Valid - Ready to Use';
      case 'available_for_resale':
        return 'Listed for Resale';
      case 'used':
        return 'Already Used';
      default:
        return status;
    }
  };
  return <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900 mb-2">
              Point of Sale
            </h1>
            <p className="text-neutral-600">
              Validate and redeem tickets at entrance
            </p>
          </div>
          <Button variant="secondary" onClick={handleBack}>
            Back to Dashboard
          </Button>
        </div>

        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Scan or Search Ticket
          </h2>
          <Input type="text" placeholder="Enter ticket ID or search by name/venue..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="text-lg" />

          {searchQuery && searchResults.length > 0 && <div className="mt-4 space-y-2">
              {searchResults.map(ticket => <button key={ticket.individualTicketId} onClick={() => handleValidateTicket(ticket)} className="w-full text-left p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-neutral-900">
                        {ticket.ticketName}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {ticket.venue} •{' '}
                        {new Date(ticket.eventDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-neutral-500 font-mono mt-1">
                        {ticket.individualTicketId}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </div>
                </button>)}
            </div>}

          {searchQuery && searchResults.length === 0 && <div className="mt-4 text-center py-8 text-neutral-500">
              No tickets found matching "{searchQuery}"
            </div>}
        </Card>

        {selectedTicket && <Card className="border-2 border-neutral-900">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-semibold text-neutral-900">
                  Ticket Details
                </h2>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusLabel(selectedTicket.status)}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {selectedTicket.ticketName}
                </h3>
                <p className="text-neutral-600">{selectedTicket.venue}</p>
                <p className="text-neutral-600">
                  {new Date(selectedTicket.eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-neutral-200">
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Ticket ID</div>
                  <div className="font-mono text-sm text-neutral-900">
                    {selectedTicket.individualTicketId}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">
                    Original Price
                  </div>
                  <div className="text-lg font-semibold text-neutral-900">
                    ${selectedTicket.price}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">
                    Purchase Date
                  </div>
                  <div className="text-neutral-900">
                    {new Date(selectedTicket.purchaseDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">
                    Current Owner
                  </div>
                  <div className="text-neutral-900 capitalize">
                    {selectedTicket.currentOwnerRole}
                  </div>
                </div>
              </div>

              {selectedTicket.status === 'available_for_resale' && selectedTicket.resalePrice && <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-900 font-medium mb-1">
                      Listed for Resale
                    </div>
                    <div className="text-lg font-semibold text-blue-900">
                      ${selectedTicket.resalePrice}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Listed on{' '}
                      {new Date(selectedTicket.resaleDate!).toLocaleDateString()}
                    </div>
                  </div>}

              {selectedTicket.currentOwnerId !== selectedTicket.originalSupplierId && <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-sm text-amber-900 font-medium">
                    ⚠️ This ticket has been resold
                  </div>
                  <div className="text-xs text-amber-700 mt-1">
                    Original supplier: {selectedTicket.originalSupplierName}
                  </div>
                </div>}

              {selectedTicket.status === 'used' && selectedTicket.usedAt && <div className="p-4 bg-neutral-100 rounded-lg">
                  <div className="text-sm text-neutral-700 font-medium mb-1">
                    Ticket Already Used
                  </div>
                  <div className="text-xs text-neutral-600">
                    Redeemed on{' '}
                    {new Date(selectedTicket.usedAt).toLocaleString()}
                  </div>
                </div>}

              <div className="flex gap-4 pt-6 border-t border-neutral-200">
                {selectedTicket.status === 'purchased' && <Button onClick={handleMarkAsUsed} className="flex-1">
                    ✓ Mark as Used
                  </Button>}
                {selectedTicket.status === 'used' && <div className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-600 rounded-lg text-center font-medium">
                    Ticket Already Redeemed
                  </div>}
                {selectedTicket.status === 'available_for_resale' && <div className="flex-1 px-6 py-3 bg-blue-50 text-blue-700 rounded-lg text-center font-medium">
                    Cannot Use - Listed for Resale
                  </div>}
                <Button variant="secondary" onClick={() => setSelectedTicket(null)}>
                  Clear
                </Button>
              </div>
            </div>
          </Card>}

        {!selectedTicket && <Card className="text-center py-12">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Ready to Scan
            </h3>
            <p className="text-neutral-600">
              Search for a ticket ID to validate and redeem
            </p>
          </Card>}
      </div>
    </div>;
}