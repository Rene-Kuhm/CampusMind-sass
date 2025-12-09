'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  social,
  StudyBuddyMatch,
  StudyBuddyPreferences,
  MarketplaceListing,
  SharedFlashcardDeck,
} from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  EmptyState,
} from '@/components/ui';
import {
  Users,
  ShoppingBag,
  Layers,
  Search,
  Plus,
  Loader2,
  UserPlus,
  Check,
  X,
  MessageSquare,
  Star,
  MapPin,
  BookOpen,
  Download,
  Heart,
  DollarSign,
  Tag,
  Eye,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'buddies' | 'marketplace' | 'decks';

export default function SocialPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('buddies');
  const [isLoading, setIsLoading] = useState(true);

  // Study Buddies
  const [buddyPreferences, setBuddyPreferences] = useState<StudyBuddyPreferences | null>(null);
  const [buddyMatches, setBuddyMatches] = useState<StudyBuddyMatch[]>([]);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  // Marketplace
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [listingType, setListingType] = useState('');

  // Shared Decks
  const [sharedDecks, setSharedDecks] = useState<SharedFlashcardDeck[]>([]);

  // Forms
  const [preferencesForm, setPreferencesForm] = useState({
    isSearching: true,
    subjects: '',
    studyStyle: 'BALANCED' as 'FORMAL' | 'PRACTICAL' | 'BALANCED',
    sameUniversity: false,
    sameCareer: false,
    sameYear: false,
  });

  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    type: 'BOOK' as MarketplaceListing['type'],
    condition: 'GOOD' as MarketplaceListing['condition'],
    price: '',
    currency: 'USD',
    isNegotiable: true,
    location: '',
    isDelivery: false,
    isPickup: true,
  });

  // Load data
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [prefs, matches, allListings, mine, decks] = await Promise.all([
        social.getBuddyPreferences(token).catch(() => null),
        social.findBuddyMatches(token).catch(() => []),
        social.getMarketplaceListings(token).catch(() => []),
        social.getMyListings(token).catch(() => []),
        social.getSharedDecks(token).catch(() => []),
      ]);
      setBuddyPreferences(prefs);
      setBuddyMatches(Array.isArray(matches) ? matches : []);
      setListings(Array.isArray(allListings) ? allListings : []);
      setMyListings(Array.isArray(mine) ? mine : []);
      setSharedDecks(Array.isArray(decks) ? decks : []);
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update buddy preferences
  const handleUpdatePreferences = async () => {
    if (!token) return;
    try {
      const updated = await social.updateBuddyPreferences(token, {
        isSearching: preferencesForm.isSearching,
        subjects: preferencesForm.subjects.split(',').map(s => s.trim()).filter(Boolean),
        studyStyle: preferencesForm.studyStyle,
        sameUniversity: preferencesForm.sameUniversity,
        sameCareer: preferencesForm.sameCareer,
        sameYear: preferencesForm.sameYear,
      });
      setBuddyPreferences(updated);
      setIsPreferencesModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  // Respond to buddy match
  const handleRespondToMatch = async (matchId: string, action: 'accept' | 'reject') => {
    if (!token) return;
    try {
      await social.respondToMatch(token, matchId, action);
      loadData();
    } catch (error) {
      console.error('Error responding:', error);
    }
  };

  // Create listing
  const handleCreateListing = async () => {
    if (!token || !listingForm.title || !listingForm.price) return;
    try {
      await social.createListing(token, {
        title: listingForm.title,
        description: listingForm.description || undefined,
        type: listingForm.type,
        condition: listingForm.condition,
        price: parseFloat(listingForm.price),
        currency: listingForm.currency,
        isNegotiable: listingForm.isNegotiable,
        location: listingForm.location || undefined,
        isDelivery: listingForm.isDelivery,
        isPickup: listingForm.isPickup,
        images: [],
        status: 'ACTIVE',
      });
      setIsListingModalOpen(false);
      resetListingForm();
      loadData();
    } catch (error) {
      console.error('Error creating listing:', error);
    }
  };

  // Delete listing
  const handleDeleteListing = async (id: string) => {
    if (!token) return;
    try {
      await social.deleteListing(token, id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // Download shared deck
  const handleDownloadDeck = async (deckId: string) => {
    if (!token) return;
    try {
      await social.downloadSharedDeck(token, deckId);
      loadData();
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const resetListingForm = () => {
    setListingForm({
      title: '',
      description: '',
      type: 'BOOK',
      condition: 'GOOD',
      price: '',
      currency: 'USD',
      isNegotiable: true,
      location: '',
      isDelivery: false,
      isPickup: true,
    });
  };

  const getConditionBadge = (condition: MarketplaceListing['condition']) => {
    const config: Record<string, { color: string; label: string }> = {
      NEW: { color: 'success', label: 'Nuevo' },
      LIKE_NEW: { color: 'success', label: 'Como nuevo' },
      GOOD: { color: 'primary', label: 'Bueno' },
      FAIR: { color: 'warning', label: 'Regular' },
      POOR: { color: 'error', label: 'Usado' },
    };
    const { color, label } = config[condition] || config.GOOD;
    return <Badge variant={color as any}>{label}</Badge>;
  };

  const getListingTypeLabel = (type: MarketplaceListing['type']) => {
    const labels: Record<string, string> = {
      BOOK: 'Libro',
      NOTES: 'Apuntes',
      CALCULATOR: 'Calculadora',
      EQUIPMENT: 'Equipo',
      TUTORING_SERVICE: 'Tutoría',
      OTHER: 'Otro',
    };
    return labels[type] || type;
  };

  const getMatchStatusBadge = (status: StudyBuddyMatch['status']) => {
    const config: Record<string, { color: string; label: string }> = {
      PENDING: { color: 'warning', label: 'Pendiente' },
      ACCEPTED: { color: 'success', label: 'Aceptado' },
      REJECTED: { color: 'error', label: 'Rechazado' },
      BLOCKED: { color: 'secondary', label: 'Bloqueado' },
    };
    const { color, label } = config[status] || config.PENDING;
    return <Badge variant={color as any}>{label}</Badge>;
  };

  const filteredListings = (Array.isArray(listings) ? listings : []).filter(listing => {
    const matchesSearch = !searchQuery ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !listingType || listing.type === listingType;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-violet-50/80 via-white to-purple-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-purple-500">
                  Comunidad
                </span>
              </h1>
              <p className="text-secondary-500 mt-0.5">Conecta, comparte y colabora</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'buddies', label: 'Study Buddies', icon: UserPlus },
              { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
              { id: 'decks', label: 'Flashcards', icon: Layers },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-violet-600"
                    : "text-secondary-600 hover:bg-white/50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Study Buddies Tab */}
          {activeTab === 'buddies' && (
            <div className="space-y-6">
              {/* Preferences Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-secondary-900">Mis preferencias</h3>
                    <Button variant="outline" size="sm" onClick={() => setIsPreferencesModalOpen(true)}>
                      Configurar
                    </Button>
                  </div>
                  {buddyPreferences ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-secondary-500">Estado</p>
                        <Badge variant={buddyPreferences.isSearching ? 'success' : 'secondary'}>
                          {buddyPreferences.isSearching ? 'Buscando' : 'No buscando'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500">Estilo</p>
                        <p className="font-medium">{buddyPreferences.studyStyle}</p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500">Materias</p>
                        <p className="font-medium">{buddyPreferences.subjects.length || 'Todas'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500">Filtros</p>
                        <div className="flex gap-1">
                          {buddyPreferences.sameUniversity && <Badge variant="outline">Universidad</Badge>}
                          {buddyPreferences.sameCareer && <Badge variant="outline">Carrera</Badge>}
                          {buddyPreferences.sameYear && <Badge variant="outline">Año</Badge>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary-500">Configura tus preferencias para encontrar compañeros de estudio</p>
                  )}
                </CardContent>
              </Card>

              {/* Matches */}
              <div>
                <h3 className="font-semibold text-secondary-900 mb-4">Coincidencias ({buddyMatches.length})</h3>
                {buddyMatches.length === 0 ? (
                  <EmptyState
                    icon={<UserPlus className="h-8 w-8" />}
                    title="Sin coincidencias"
                    description="Configura tus preferencias para encontrar compañeros"
                    action={
                      <Button variant="gradient" onClick={() => setIsPreferencesModalOpen(true)}>
                        Configurar preferencias
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {buddyMatches.map(match => (
                      <Card key={match.id} className="overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {match.user?.profile?.firstName?.[0] || 'U'}
                              </div>
                              <div>
                                <h4 className="font-semibold text-secondary-900">
                                  {match.user?.profile?.firstName} {match.user?.profile?.lastName}
                                </h4>
                                {match.user?.profile?.university && (
                                  <p className="text-sm text-secondary-500">{match.user.profile.university}</p>
                                )}
                              </div>
                            </div>
                            {getMatchStatusBadge(match.status)}
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center gap-2 text-sm text-secondary-600 mb-2">
                              <Star className="h-4 w-4 text-amber-500" />
                              <span>Compatibilidad: {match.matchScore}%</span>
                            </div>
                            {match.commonSubjects.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {match.commonSubjects.map(subject => (
                                  <Badge key={subject} variant="outline" className="text-xs">
                                    {subject}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {match.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <Button
                                variant="gradient"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleRespondToMatch(match.id, 'accept')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aceptar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleRespondToMatch(match.id, 'reject')}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}

                          {match.status === 'ACCEPTED' && (
                            <Button variant="outline" size="sm" className="w-full">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Enviar mensaje
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              {/* Search & Filters */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                  <Input
                    className="pl-10"
                    placeholder="Buscar en el marketplace..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  options={[
                    { value: '', label: 'Todos los tipos' },
                    { value: 'BOOK', label: 'Libros' },
                    { value: 'NOTES', label: 'Apuntes' },
                    { value: 'CALCULATOR', label: 'Calculadoras' },
                    { value: 'EQUIPMENT', label: 'Equipos' },
                    { value: 'TUTORING_SERVICE', label: 'Tutorías' },
                    { value: 'OTHER', label: 'Otros' },
                  ]}
                  className="w-48"
                />
                <Button variant="gradient" onClick={() => setIsListingModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Publicar
                </Button>
              </div>

              {/* My Listings */}
              {myListings.length > 0 && (
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-3">Mis publicaciones</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {myListings.map(listing => (
                      <Card key={listing.id} className="overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-500" />
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline">{getListingTypeLabel(listing.type)}</Badge>
                            {getConditionBadge(listing.condition)}
                          </div>
                          <h4 className="font-semibold text-secondary-900 mb-1">{listing.title}</h4>
                          <p className="text-lg font-bold text-violet-600 mb-2">
                            ${listing.price} {listing.currency}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-secondary-500">
                            <Eye className="h-4 w-4" />
                            {listing.viewCount} vistas
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => handleDeleteListing(listing.id)}
                          >
                            Eliminar
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* All Listings */}
              <div>
                <h3 className="font-semibold text-secondary-900 mb-3">
                  Publicaciones ({filteredListings.length})
                </h3>
                {filteredListings.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingBag className="h-8 w-8" />}
                    title="Sin publicaciones"
                    description="Sé el primero en publicar algo"
                    action={
                      <Button variant="gradient" onClick={() => setIsListingModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Publicar
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredListings.map(listing => (
                      <Card
                        key={listing.id}
                        className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                        onClick={() => setSelectedListing(listing)}
                      >
                        <div className="h-40 bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-secondary-400" />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline">{getListingTypeLabel(listing.type)}</Badge>
                            {getConditionBadge(listing.condition)}
                          </div>
                          <h4 className="font-semibold text-secondary-900 mb-1 line-clamp-1">{listing.title}</h4>
                          {listing.description && (
                            <p className="text-sm text-secondary-500 line-clamp-2 mb-2">{listing.description}</p>
                          )}
                          <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                            <p className="text-lg font-bold text-violet-600">
                              ${listing.price}
                              {listing.isNegotiable && (
                                <span className="text-xs font-normal text-secondary-500 ml-1">negociable</span>
                              )}
                            </p>
                            {listing.location && (
                              <span className="flex items-center gap-1 text-sm text-secondary-500">
                                <MapPin className="h-3 w-3" />
                                {listing.location}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shared Decks Tab */}
          {activeTab === 'decks' && (
            <div>
              {sharedDecks.length === 0 ? (
                <EmptyState
                  icon={<Layers className="h-8 w-8" />}
                  title="Sin flashcards compartidos"
                  description="Comparte tus mazos de flashcards con la comunidad"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharedDecks.map(deck => (
                    <Card key={deck.id} className="group hover:shadow-lg transition-all overflow-hidden">
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Layers className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-medium">{deck.rating.toFixed(1)}</span>
                            <span className="text-secondary-400 text-sm">({deck.ratingCount})</span>
                          </div>
                        </div>

                        <h4 className="font-semibold text-secondary-900 mb-1">{deck.title}</h4>
                        {deck.description && (
                          <p className="text-sm text-secondary-500 line-clamp-2 mb-3">{deck.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1 mb-4">
                          {deck.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                          <span className="flex items-center gap-1 text-sm text-secondary-500">
                            <Download className="h-4 w-4" />
                            {deck.downloadCount}
                          </span>
                          <Button
                            variant="gradient"
                            size="sm"
                            onClick={() => handleDownloadDeck(deck.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preferences Modal */}
      <Modal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        title="Preferencias de Study Buddy"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferencesForm.isSearching}
              onChange={(e) => setPreferencesForm(prev => ({ ...prev, isSearching: e.target.checked }))}
              className="rounded border-secondary-300"
            />
            <label className="text-sm text-secondary-700">Estoy buscando compañeros de estudio</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Materias de interés (separadas por comas)
            </label>
            <Input
              placeholder="Matemáticas, Física, Programación..."
              value={preferencesForm.subjects}
              onChange={(e) => setPreferencesForm(prev => ({ ...prev, subjects: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Estilo de estudio</label>
            <Select
              value={preferencesForm.studyStyle}
              onChange={(e) => setPreferencesForm(prev => ({ ...prev, studyStyle: e.target.value as any }))}
              options={[
                { value: 'FORMAL', label: 'Formal (estructurado)' },
                { value: 'PRACTICAL', label: 'Práctico (ejercicios)' },
                { value: 'BALANCED', label: 'Balanceado' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">Filtros</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferencesForm.sameUniversity}
                  onChange={(e) => setPreferencesForm(prev => ({ ...prev, sameUniversity: e.target.checked }))}
                  className="rounded border-secondary-300"
                />
                <span className="text-sm text-secondary-700">Misma universidad</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferencesForm.sameCareer}
                  onChange={(e) => setPreferencesForm(prev => ({ ...prev, sameCareer: e.target.checked }))}
                  className="rounded border-secondary-300"
                />
                <span className="text-sm text-secondary-700">Misma carrera</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferencesForm.sameYear}
                  onChange={(e) => setPreferencesForm(prev => ({ ...prev, sameYear: e.target.checked }))}
                  className="rounded border-secondary-300"
                />
                <span className="text-sm text-secondary-700">Mismo año</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsPreferencesModalOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleUpdatePreferences}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Create Listing Modal */}
      <Modal
        isOpen={isListingModalOpen}
        onClose={() => { setIsListingModalOpen(false); resetListingForm(); }}
        title="Nueva publicación"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Título *</label>
            <Input
              placeholder="¿Qué estás vendiendo?"
              value={listingForm.title}
              onChange={(e) => setListingForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Descripción</label>
            <textarea
              className="w-full h-24 p-3 border border-secondary-200 rounded-lg resize-none"
              placeholder="Describe tu producto..."
              value={listingForm.description}
              onChange={(e) => setListingForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Tipo</label>
              <Select
                value={listingForm.type}
                onChange={(e) => setListingForm(prev => ({ ...prev, type: e.target.value as any }))}
                options={[
                  { value: 'BOOK', label: 'Libro' },
                  { value: 'NOTES', label: 'Apuntes' },
                  { value: 'CALCULATOR', label: 'Calculadora' },
                  { value: 'EQUIPMENT', label: 'Equipo' },
                  { value: 'TUTORING_SERVICE', label: 'Servicio de tutoría' },
                  { value: 'OTHER', label: 'Otro' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Condición</label>
              <Select
                value={listingForm.condition}
                onChange={(e) => setListingForm(prev => ({ ...prev, condition: e.target.value as any }))}
                options={[
                  { value: 'NEW', label: 'Nuevo' },
                  { value: 'LIKE_NEW', label: 'Como nuevo' },
                  { value: 'GOOD', label: 'Bueno' },
                  { value: 'FAIR', label: 'Regular' },
                  { value: 'POOR', label: 'Usado' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Precio *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <Input
                  type="number"
                  className="pl-9"
                  placeholder="0.00"
                  value={listingForm.price}
                  onChange={(e) => setListingForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Ubicación</label>
              <Input
                placeholder="Ciudad, Campus..."
                value={listingForm.location}
                onChange={(e) => setListingForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={listingForm.isNegotiable}
                onChange={(e) => setListingForm(prev => ({ ...prev, isNegotiable: e.target.checked }))}
                className="rounded border-secondary-300"
              />
              <span className="text-sm text-secondary-700">Precio negociable</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={listingForm.isDelivery}
                onChange={(e) => setListingForm(prev => ({ ...prev, isDelivery: e.target.checked }))}
                className="rounded border-secondary-300"
              />
              <span className="text-sm text-secondary-700">Envío disponible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={listingForm.isPickup}
                onChange={(e) => setListingForm(prev => ({ ...prev, isPickup: e.target.checked }))}
                className="rounded border-secondary-300"
              />
              <span className="text-sm text-secondary-700">Retiro en persona</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => { setIsListingModalOpen(false); resetListingForm(); }}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleCreateListing}
              disabled={!listingForm.title || !listingForm.price}
            >
              <Plus className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Listing Detail Modal */}
      <Modal
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title={selectedListing?.title || ''}
        size="lg"
      >
        {selectedListing && (
          <div className="space-y-4">
            <div className="h-48 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-secondary-400" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getListingTypeLabel(selectedListing.type)}</Badge>
                {getConditionBadge(selectedListing.condition)}
              </div>
              <p className="text-2xl font-bold text-violet-600">
                ${selectedListing.price} {selectedListing.currency}
                {selectedListing.isNegotiable && (
                  <span className="text-sm font-normal text-secondary-500 ml-2">negociable</span>
                )}
              </p>
            </div>

            {selectedListing.description && (
              <p className="text-secondary-600">{selectedListing.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary-50 rounded-xl">
              {selectedListing.location && (
                <div className="flex items-center gap-2 text-sm text-secondary-600">
                  <MapPin className="h-4 w-4" />
                  {selectedListing.location}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-secondary-600">
                <Eye className="h-4 w-4" />
                {selectedListing.viewCount} vistas
              </div>
              {selectedListing.isDelivery && (
                <div className="flex items-center gap-2 text-sm text-secondary-600">
                  <Send className="h-4 w-4" />
                  Envío disponible
                </div>
              )}
              {selectedListing.isPickup && (
                <div className="flex items-center gap-2 text-sm text-secondary-600">
                  <Users className="h-4 w-4" />
                  Retiro en persona
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedListing(null)}>Cerrar</Button>
              <Button variant="gradient">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contactar vendedor
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
