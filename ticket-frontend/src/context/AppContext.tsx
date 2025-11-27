import React, { useEffect, useState, createContext, useContext } from 'react';
interface Ticket {
  ticketId: string;
  ticketName: string;
  venue: string;
  eventDate: string;
  price: number;
  description: string;
  rules: Record<string, any>;
  status: 'Available' | 'Sold' | 'Available for Resale' | 'Cancelled';
  quantity: number;
  remainingQuantity: number;
  supplierId: string;
  supplierName: string;
}
interface IndividualTicket {
  individualTicketId: string;
  bulkTicketId: string;
  ticketName: string;
  venue: string;
  eventDate: string;
  price: number;
  description: string;
  originalSupplierId: string;
  originalSupplierName: string;
  currentOwnerId: string;
  currentOwnerRole: 'supplier' | 'distributor';
  status: 'purchased' | 'available_for_resale' | 'used';
  purchaseDate: string;
  resalePrice?: number;
  resaleDate?: string;
  usedAt?: string;
}
interface Supplier {
  id: string;
  name: string;
  email: string;
  company: string;
}
interface Distributor {
  id: string;
  name: string;
  email: string;
  company: string;
}
interface AppContextType {
  suppliers: Supplier[];
  distributors: Distributor[];
  tickets: Ticket[];
  individualTickets: IndividualTicket[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => string;
  addDistributor: (distributor: Omit<Distributor, 'id'>) => string;
  addTicket: (ticket: Omit<Ticket, 'ticketId' | 'remainingQuantity'>) => void;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => void;
  purchaseTickets: (bulkTicketId: string, quantity: number, distributorId: string) => void;
  resellTicket: (individualTicketId: string, resalePrice: number) => void;
  purchaseResaleTicket: (individualTicketId: string, newOwnerId: string) => void;
  markTicketAsUsed: (individualTicketId: string) => void;
  currentUser: {
    id: string;
    role: 'supplier' | 'distributor';
  } | null;
  setCurrentUser: (user: {
    id: string;
    role: 'supplier' | 'distributor';
  } | null) => void;
}
const AppContext = createContext<AppContextType | undefined>(undefined);
export function AppProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [individualTickets, setIndividualTickets] = useState<IndividualTicket[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: 'supplier' | 'distributor';
  } | null>(null);
  useEffect(() => {
    const savedSuppliers = localStorage.getItem('suppliers');
    const savedDistributors = localStorage.getItem('distributors');
    const savedTickets = localStorage.getItem('tickets');
    const savedIndividualTickets = localStorage.getItem('individualTickets');
    const savedUser = localStorage.getItem('currentUser');
    if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
    if (savedDistributors) setDistributors(JSON.parse(savedDistributors));
    if (savedTickets) setTickets(JSON.parse(savedTickets));
    if (savedIndividualTickets) setIndividualTickets(JSON.parse(savedIndividualTickets));
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);
  useEffect(() => {
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
  }, [suppliers]);
  useEffect(() => {
    localStorage.setItem('distributors', JSON.stringify(distributors));
  }, [distributors]);
  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);
  useEffect(() => {
    localStorage.setItem('individualTickets', JSON.stringify(individualTickets));
  }, [individualTickets]);
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const id = `SUP-${Date.now()}`;
    setSuppliers([...suppliers, {
      ...supplier,
      id
    }]);
    return id;
  };
  const addDistributor = (distributor: Omit<Distributor, 'id'>) => {
    const id = `DIST-${Date.now()}`;
    setDistributors([...distributors, {
      ...distributor,
      id
    }]);
    return id;
  };
  const addTicket = (ticket: Omit<Ticket, 'ticketId' | 'remainingQuantity'>) => {
    const ticketId = `TKT-${Date.now()}`;
    setTickets([...tickets, {
      ...ticket,
      ticketId,
      remainingQuantity: ticket.quantity
    }]);
  };
  const updateTicketStatus = (ticketId: string, status: Ticket['status']) => {
    setTickets(tickets.map(t => t.ticketId === ticketId ? {
      ...t,
      status
    } : t));
  };
  const purchaseTickets = (bulkTicketId: string, quantity: number, distributorId: string) => {
    const bulkTicket = tickets.find(t => t.ticketId === bulkTicketId);
    if (!bulkTicket || bulkTicket.remainingQuantity < quantity) {
      throw new Error('Insufficient tickets available');
    }
    // Update bulk ticket remaining quantity
    setTickets(tickets.map(t => t.ticketId === bulkTicketId ? {
      ...t,
      remainingQuantity: t.remainingQuantity - quantity
    } : t));
    // Create individual tickets
    const newIndividualTickets: IndividualTicket[] = [];
    for (let i = 0; i < quantity; i++) {
      newIndividualTickets.push({
        individualTicketId: `IND-${Date.now()}-${i}`,
        bulkTicketId: bulkTicket.ticketId,
        ticketName: bulkTicket.ticketName,
        venue: bulkTicket.venue,
        eventDate: bulkTicket.eventDate,
        price: bulkTicket.price,
        description: bulkTicket.description,
        originalSupplierId: bulkTicket.supplierId,
        originalSupplierName: bulkTicket.supplierName,
        currentOwnerId: distributorId,
        currentOwnerRole: 'distributor',
        status: 'purchased',
        purchaseDate: new Date().toISOString()
      });
    }
    setIndividualTickets([...individualTickets, ...newIndividualTickets]);
  };
  const resellTicket = (individualTicketId: string, resalePrice: number) => {
    setIndividualTickets(individualTickets.map(t => t.individualTicketId === individualTicketId ? {
      ...t,
      status: 'available_for_resale',
      resalePrice,
      resaleDate: new Date().toISOString()
    } : t));
  };
  const purchaseResaleTicket = (individualTicketId: string, newOwnerId: string) => {
    setIndividualTickets(individualTickets.map(t => t.individualTicketId === individualTicketId ? {
      ...t,
      currentOwnerId: newOwnerId,
      currentOwnerRole: 'distributor' as const,
      status: 'purchased',
      purchaseDate: new Date().toISOString()
    } : t));
  };
  const markTicketAsUsed = (individualTicketId: string) => {
    setIndividualTickets(individualTickets.map(t => t.individualTicketId === individualTicketId ? {
      ...t,
      status: 'used',
      usedAt: new Date().toISOString()
    } : t));
  };
  return <AppContext.Provider value={{
    suppliers,
    distributors,
    tickets,
    individualTickets,
    addSupplier,
    addDistributor,
    addTicket,
    updateTicketStatus,
    purchaseTickets,
    resellTicket,
    purchaseResaleTicket,
    markTicketAsUsed,
    currentUser,
    setCurrentUser
  }}>
      {children}
    </AppContext.Provider>;
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}