import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Plus,
  Check,
  Star,
  Calendar,
  Clock,
  Building2,
  Film,
  ChevronLeft,
  Share2,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Twitter,
  MessageCircle,
  Copy,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import AnimeCard from '@/components/AnimeCard';
import CommentSection from '@/components/CommentSection';
import CharacterSection from '@/components/CharacterSection';
import { AnimeDetailSEO } from '@/components/Seo';
import { AnimeDetailSkeleton } from '@/components/skeletons/AnimeDetailSkeleton';
import StatusBadge from '@/components/StatusBadge';
import TypeBadge from '@/components/TypeBadge';
import { AnimeSchema, BreadcrumbSchema } from '@/components/SchemaOrg';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BACKEND_URL } from '@/config/api';
import { getAuthHeaders } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    animeList,
    isLoading: animeListLoading,
    bookmarks,
    toggleBookmark,
    watchlist,
    toggleWatchlist,
    getLastWatched,
    user,
    // Database-backed features
    getUserRating,
    rateAnime,
    getWatchedEpisodes,
    toggleEpisodeWatched,
  } = useApp();
  const [episodeView, setEpisodeView] = useState<'compact' | 'comfy'>('comfy');
  const [episodeFilter, setEpisodeFilter] = useState<'all' | 'unwatched' | 'watched' | 'latest'>('all');
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  const anime = id ? animeList.find(a => a.id === id) : undefined;
  const isBookmarked = id ? bookmarks.includes(id) : false;
  const isInWatchlist = id ? watchlist.includes(id) : false;
  const lastWatched = id ? getLastWatched(id) : undefined;

  // Get database-backed data
  const userRating = id ? getUserRating(id) : 0;
  const watchedEpisodes = id ? getWatchedEpisodes(id) : [];

  // UI state only
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  // Save user rating (Database-backed)
  const handleRating = (rating: number) => {
    if (id) rateAnime(id, rating);
  };

  // Toggle episode watched (Database-backed)
  const handleToggleEpisodeWatched = (epNum: number) => {
    if (id) toggleEpisodeWatched(id, epNum);
  };

  // Fetch notification subscription status
  useEffect(() => {
    if (!user || !id) {
      setNotifyEnabled(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const res = await apiFetch(`${BACKEND_URL}/api/schedule-subscriptions/check?userId=${user.id}&animeId=${id}`, {
          headers: { ...getAuthHeaders() }
        });
        const data = await res.json();
        setNotifyEnabled(data.subscribed || false);
      } catch (err) {
        console.error('Failed to check subscription:', err);
      }
    };

    fetchSubscription();
  }, [user, id]);

  // Toggle notification subscription (Backend API)
  const toggleNotify = async () => {
    if (!user || !id || !anime) {
      alert('Login untuk mengaktifkan notifikasi');
      return;
    }

    setNotifyLoading(true);
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/schedule-subscriptions/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          userId: user.id,
          animeId: id,
          animeTitle: anime.title,
          animePoster: anime.poster,
          scheduleDay: anime.jadwalRilis?.hari,
          scheduleTime: anime.jadwalRilis?.jam
        })
      });

      const data = await res.json();
      setNotifyEnabled(data.subscribed);
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
    } finally {
      setNotifyLoading(false);
    }
  };

  // Social share functions
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Nonton ${anime?.title} di Animeku! 🎬`;

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy link failed:', err);
    }
  };

  // Jadwal Rilis (untuk anime ongoing) - gunakan data dari database
  const jadwalRilis = anime?.status === 'Ongoing' && anime?.jadwalRilis ? {
    hari: anime.jadwalRilis.hari,
    jam: anime.jadwalRilis.jam || '??:?? WIB'
  } : null;

  // Get related anime by genres
  const relatedAnime = anime
    ? animeList.filter(a =>
      a.id !== anime.id &&
      a.genres.some(g => anime.genres.includes(g))
    ).slice(0, 12)
    : [];
  const episodeNumbers = anime
    ? (anime.episodeData && anime.episodeData.length > 0
      ? anime.episodeData.map(e => e.ep || e.episodeNumber || 0).sort((a, b) => a - b)
      : Array.from({ length: anime.episodes }, (_, i) => i + 1))
    : [];
  const latestEpisode = episodeNumbers.length > 0 ? episodeNumbers[episodeNumbers.length - 1] : null;

  const filteredEpisodes = episodeNumbers.filter((epNum) => {
    if (episodeFilter === 'latest') {
      return epNum === latestEpisode;
    }
    if (episodeFilter === 'watched') {
      return watchedEpisodes.includes(epNum);
    }
    if (episodeFilter === 'unwatched') {
      return !watchedEpisodes.includes(epNum);
    }
    return true;
  }).filter((epNum) => {
    if (!episodeSearch.trim()) return true;
    return String(epNum).includes(episodeSearch.trim());
  });

  useEffect(() => {
    const update = () => setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    setEpisodeView(isMobile ? 'compact' : 'comfy');
  }, [isMobile]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (animeListLoading) {
    return <AnimeDetailSkeleton />;
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Anime Tidak Ditemukan</h1>
          <p className="text-white/50 mb-8">Maaf, anime yang Anda cari tidak tersedia.</p>
          <Link to="/" className="btn-primary">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { name: 'Home', url: 'https://animeku.xyz/' },
    { name: anime?.title || 'Detail Anime', url: `https://animeku.xyz/anime/${id}` }
  ];

  return (
    <main className="min-h-screen bg-[#0F0F1A]">
      {anime && (
        <AnimeDetailSEO
          title={anime.title}
          description={anime.synopsis || `Nonton ${anime.title} subtitle Indonesia streaming gratis di Animeku`}
          image={anime.banner || anime.poster}
          url={`/anime/${anime.id}`}
          rating={String(anime.rating)}
          genres={anime.genres}
          status={anime.status}
          episodes={anime.episodes}
          year={anime.releasedYear}
        />
      )}
      
      {/* Schema.org JSON-LD */}
      {anime && (
        <>
          <AnimeSchema
            title={anime.title}
            description={anime.synopsis}
            poster={anime.poster}
            banner={anime.banner}
            rating={anime.rating}
            status={anime.status}
            episodes={anime.episodes}
            genres={(anime as any).genres || (anime as any).genre}
            studio={anime.studio}
            releaseYear={(anime as any).tahunRilis || (anime as any).releaseYear}
            url={`https://animeku.xyz/anime/${id}`}
            episodeData={anime.episodeData?.map((ep: any) => ({ ep: ep.ep || 1, subtitle: ep.subtitle }))}
          />
          <BreadcrumbSchema items={breadcrumbItems} />
        </>
      )}
      {/* Hero Banner */}
      <div className="relative">
        {/* Background - absolute positioned */}
        <div className="absolute inset-0 h-[300px] sm:h-[400px] lg:h-[500px]">
          <img
            src={anime.banner || anime.poster}
            alt={anime.title}
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-[#0F0F1A]/80 to-[#0F0F1A]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F1A]/90 via-[#0F0F1A]/50 to-transparent" />
        </div>

        {/* Back Button - Aligned with Grid */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
          <button
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/50 backdrop-blur-sm rounded-lg sm:rounded-xl text-white/70 hover:text-white transition-colors text-sm"
          >
            <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
            Kembali
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-6">
          {/* Mobile: Stacked Layout | Desktop: Side by Side */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 items-center sm:items-start w-full">
            {/* Poster - Mobile: Larger & Centered */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative flex-shrink-0 w-40 sm:w-40 lg:w-56 aspect-[3/4]"
            >
              <div className="absolute -inset-2 sm:-inset-3 rounded-2xl bg-gradient-to-br from-[#6C5DD3]/35 via-[#00C2FF]/20 to-transparent blur-2xl opacity-90" />
              <div className="relative w-full h-full rounded-2xl sm:rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                <img
                  src={anime.poster}
                  alt={anime.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
                {/* Mobile: Badges on Poster */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 sm:hidden">
                  <StatusBadge status={anime.status} variant="solid" className="!text-[10px] !px-2 !py-0.5" />
                  {anime.type && (
                    <TypeBadge type={anime.type} variant="card" className="!text-[10px] !px-2 !py-0.5" />
                  )}
                </div>
                {/* Mobile: Rating on Poster */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full sm:hidden">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-[10px] font-bold text-white">{anime.rating}</span>
                </div>
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 min-w-0 w-full pb-2 sm:pb-4"
            >
              {/* Title - Mobile: Centered & Larger */}
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold font-heading text-white mb-1 sm:mb-2 leading-tight line-clamp-2 text-center sm:text-left">
                {anime.title}
              </h1>
              {anime.titleJp && (
                <p className="text-white/50 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 line-clamp-1 text-center sm:text-left">{anime.titleJp}</p>
              )}

              {/* Meta - Desktop Only */}
              <div className="hidden sm:flex flex-wrap items-center gap-1.5 sm:gap-3 mb-2 sm:mb-3">
                <span className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-500/20 text-yellow-400 text-[10px] sm:text-xs font-bold rounded-full">
                  <Star className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-current" />
                  {anime.rating}
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={anime.status} variant="subtle" className="!px-2 sm:!px-3 !py-0.5 sm:!py-1 !text-[10px] sm:!text-xs !font-bold !rounded-full" />
                  {anime.type && (
                    <TypeBadge type={anime.type} variant="card" className="!text-[10px] sm:!text-xs !px-2 sm:!px-3 !py-0.5 sm:!py-1" />
                  )}
                </div>
              </div>

              {/* Mobile: Info Pills - Horizontal Scroll */}
              <div className="flex sm:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                  <span className="text-xs font-semibold text-white">{anime.rating}</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <Film className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-white">{episodeNumbers.length}/{anime.episodes} EP</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-semibold text-white">{anime.releasedYear}</span>
                </div>
                {anime.duration && (
                  <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                    <Clock className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-semibold text-white">{anime.duration}</span>
                  </div>
                )}
              </div>

              {/* Desktop: Highlight Info Grid */}
              <div className="hidden sm:grid mt-2 grid-cols-4 lg:grid-cols-5 gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <div className="text-xs">
                    <p className="text-white/40">Rating</p>
                    <p className="text-white font-semibold">{anime.rating}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Film className="w-4 h-4 text-blue-400" />
                  <div className="text-xs">
                    <p className="text-white/40">Episode</p>
                    <p className="text-white font-semibold">{episodeNumbers.length} <span className="text-white/40">/ {anime.episodes}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <div className="text-xs">
                    <p className="text-white/40">Rilis</p>
                    <p className="text-white font-semibold">{anime.releasedYear}</p>
                  </div>
                </div>
                {anime.duration && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Clock className="w-4 h-4 text-white/70" />
                    <div className="text-xs">
                      <p className="text-white/40">Durasi</p>
                      <p className="text-white font-semibold">{anime.duration}</p>
                    </div>
                  </div>
                )}
                {anime.studio && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Building2 className="w-4 h-4 text-white/70" />
                    <div className="text-xs">
                      <p className="text-white/40">Studio</p>
                      <p className="text-white font-semibold line-clamp-1">{anime.studio}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule + Genres Row */}
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4 lg:mb-6">
                {jadwalRilis && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-200 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-green-400" />
                    <span className="whitespace-nowrap">Tayang {jadwalRilis.hari}</span>
                    <span className="text-green-300/70">•</span>
                    <span className="font-semibold whitespace-nowrap">{jadwalRilis.jam}</span>
                  </span>
                )}
                {anime.genres.slice(0, 4).map((genre) => (
                  <Link
                    key={genre}
                    to={`/genres?genre=${genre}`}
                    className="px-3 py-1 bg-gradient-to-r from-[#6C5DD3]/20 to-[#00C2FF]/20 hover:from-[#6C5DD3]/30 hover:to-[#00C2FF]/30 text-white/80 text-xs rounded-full transition-all border border-[#6C5DD3]/30"
                  >
                    {genre}
                  </Link>
                ))}
              </div>

              {/* Actions - Mobile: Full Width */}
              <div className="mt-4 flex items-center gap-2 sm:gap-3 rounded-2xl bg-white/5 border border-white/10 p-2 sm:p-3" ref={actionsRef}>
                <Link
                  to={`/watch/${anime.id}/${lastWatched?.episodeNumber || 1}`}
                  className="flex-1 sm:flex-none btn-primary flex items-center justify-center gap-2 text-sm px-4 py-3 sm:py-2.5"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{lastWatched ? `Lanjut EP ${lastWatched.episodeNumber}` : 'Tonton Sekarang'}</span>
                </Link>

                <button
                  onClick={() => toggleBookmark(anime.id)}
                  className={`btn-secondary flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-3 sm:py-2.5 ${isBookmarked ? 'bg-[#6C5DD3] border-[#6C5DD3]' : ''}`}
                >
                  {isBookmarked ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  <span className="hidden sm:inline">{isBookmarked ? 'Tersimpan' : 'Favorit'}</span>
                </button>

                {/* Watchlist - Desktop Only */}
                <button
                  onClick={() => toggleWatchlist(anime.id)}
                  className={`hidden sm:flex btn-secondary items-center gap-2 ${isInWatchlist ? 'bg-green-500/20 border-green-500/50' : ''}`}
                >
                  {isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {isInWatchlist ? 'Di Watchlist' : 'Watchlist'}
                </button>

                {/* Notification Bell for Ongoing */}
                {anime.status === 'Ongoing' && (
                  <button
                    onClick={toggleNotify}
                    disabled={notifyLoading}
                    className={`p-3 rounded-xl transition-colors ${notifyEnabled ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'} ${notifyLoading ? 'opacity-50 cursor-wait' : ''}`}
                    title={notifyEnabled ? 'Notifikasi Aktif' : 'Aktifkan Notifikasi'}
                  >
                    {notifyLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : notifyEnabled ? (
                      <Bell className="w-5 h-5" />
                    ) : (
                      <BellOff className="w-5 h-5" />
                    )}
                  </button>
                )}

                {/* Share Dialog */}
                <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1A1A2E] border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-white">Bagikan Anime</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {/* Social Share Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={shareToTwitter}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] rounded-xl transition-colors"
                        >
                          <Twitter className="w-5 h-5" />
                          Twitter
                        </button>
                        <button
                          onClick={shareToWhatsApp}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] rounded-xl transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          WhatsApp
                        </button>
                      </div>
                      {/* Copy Link */}
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={shareUrl}
                          readOnly
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                        />
                        <Button
                          onClick={copyLink}
                          className={`${copied ? 'bg-green-500' : 'bg-[#6C5DD3] hover:bg-[#5a4ec0]'}`}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* User Rating - Compact on mobile */}
              <div className="mt-4 flex sm:hidden items-center gap-2 flex-wrap">
                <span className="text-white/50 text-xs">Rating Anda:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      className="transition-transform hover:scale-110"
                      aria-label={`Beri rating ${star}`}
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${star <= (hoverRating || userRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-white/20'
                          }`}
                      />
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <span className="text-yellow-400 font-medium text-xs">{userRating}/10</span>
                )}
              </div>

              {/* User Rating - hidden on very small screens */}
              <div className="hidden sm:flex mt-4 items-center gap-2 sm:gap-4 flex-wrap">
                <span className="text-white/50 text-xs sm:text-sm">Rating Anda:</span>
                <div className="flex gap-0.5 sm:gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-4 sm:w-5 h-4 sm:h-5 transition-colors ${star <= (hoverRating || userRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-white/20'
                          }`}
                      />
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <span className="text-yellow-400 font-medium text-sm">{userRating}/10</span>
                )}
              </div>

              {/* Jadwal moved above - remove duplicate */}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs defaultValue="episodes" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-0.5 sm:p-1 mb-4 sm:mb-6 w-full sm:w-auto">
            <TabsTrigger
              value="episodes"
              className="data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              Episode
            </TabsTrigger>
            <TabsTrigger
              value="characters"
              className="data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              Karakter
            </TabsTrigger>
            <TabsTrigger
              value="synopsis"
              className="data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              Sinopsis
            </TabsTrigger>
            <TabsTrigger
              value="related"
              className="data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              Terkait
            </TabsTrigger>
          </TabsList>

          {/* Episodes Tab */}
          <TabsContent value="episodes">
            {/* Modern Progress Stats Bar */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Progress Info */}
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12">
                    {/* Circular Progress */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(watchedEpisodes.length / (episodeNumbers.length || 1)) * 125.6} 125.6`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs">Progress Menonton</p>
                    <p className="text-white font-semibold">
                      <span className="text-green-400">{watchedEpisodes.length}</span>
                      <span className="text-white/50"> / {episodeNumbers.length} tersedia</span>
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-10 bg-white/10" />

                {/* Next Episode */}
                {lastWatched && lastWatched.episodeNumber < episodeNumbers.length && (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[#6C5DD3]/20 flex items-center justify-center">
                      <Play className="w-5 h-5 text-[#6C5DD3]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/50 text-xs">Lanjutkan</p>
                      <Link 
                        to={`/watch/${anime.id}/${lastWatched.episodeNumber + 1}`}
                        className="text-white font-medium hover:text-[#6C5DD3] transition-colors"
                      >
                        Episode {lastWatched.episodeNumber + 1}
                      </Link>
                    </div>
                    <Link
                      to={`/watch/${anime.id}/${lastWatched.episodeNumber + 1}`}
                      className="px-4 py-2 rounded-xl bg-[#6C5DD3] hover:bg-[#5a4ec0] text-white text-sm font-medium transition-colors"
                    >
                      Play
                    </Link>
                  </div>
                )}

                {/* Completed Badge */}
                {watchedEpisodes.length === episodeNumbers.length && episodeNumbers.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-green-400 font-semibold">Selesai!</p>
                      <p className="text-white/50 text-xs">Semua episode ditonton</p>
                    </div>
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* View Toggle & Quick Actions */}
                <div className="flex items-center gap-2">
                  {latestEpisode && (
                    <button
                      onClick={() => {
                        const el = document.getElementById('latest-episode');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      EP Terbaru
                    </button>
                  )}
                  <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
                    <button
                      onClick={() => setEpisodeView('compact')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${episodeView === 'compact'
                        ? 'bg-[#6C5DD3] text-white'
                        : 'text-white/60 hover:text-white'
                        }`}
                    >
                      Ringkas
                    </button>
                    <button
                      onClick={() => setEpisodeView('comfy')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${episodeView === 'comfy'
                        ? 'bg-[#6C5DD3] text-white'
                        : 'text-white/60 hover:text-white'
                        }`}
                    >
                      Nyaman
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Episode Filter & Search - Mobile: Horizontal Scroll */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 p-1 text-xs flex-shrink-0">
                  {(['all', 'unwatched', 'watched', 'latest'] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setEpisodeFilter(key)}
                      className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${episodeFilter === key ? 'bg-[#6C5DD3] text-white' : 'text-white/60 hover:text-white'}`}
                    >
                      {key === 'all' && 'Semua'}
                      {key === 'unwatched' && 'Belum Ditonton'}
                      {key === 'watched' && 'Ditonton'}
                      {key === 'latest' && 'Terbaru'}
                    </button>
                  ))}
                </div>
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Cari..."
                    value={episodeSearch}
                    onChange={(e) => setEpisodeSearch(e.target.value)}
                    className="w-28 sm:w-56 pl-9 pr-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                  />
                </div>
                {(episodeFilter !== 'all' || episodeSearch) && (
                  <button
                    onClick={() => {
                      setEpisodeFilter('all');
                      setEpisodeSearch('');
                    }}
                    className="flex-shrink-0 text-xs text-white/50 hover:text-white transition-colors px-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            {/* Modern Episode Grid */}
            <div className={`${episodeView === 'compact' 
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3' 
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            }`}>
              {filteredEpisodes.map((epNum) => {
                const isWatched = watchedEpisodes.includes(epNum);
                const isLatest = epNum === latestEpisode;
                const isLastWatched = lastWatched?.episodeNumber === epNum;
                const episodeData = anime.episodeData?.find((e: any) => e.ep === epNum);
                const thumbnailUrl = episodeData?.thumbnail || anime.poster;
                const hasRealThumbnail = !!episodeData?.thumbnail;
                const episodeTitle = episodeData?.title;
                
                return (
                  <Link
                    to={`/watch/${anime.id}/${epNum}`}
                    key={epNum}
                    id={isLatest ? 'latest-episode' : undefined}
                    className={`group relative rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden ${episodeView === 'compact' ? 'aspect-video' : ''} ${isLatest
                      ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/40 hover:border-yellow-500/60 shadow-[0_0_30px_rgba(234,179,8,0.1)]'
                      : isWatched
                      ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30 hover:border-green-500/50'
                      : isLastWatched
                        ? 'bg-gradient-to-br from-[#6C5DD3]/20 to-[#8B7BEF]/10 border-[#6C5DD3] hover:border-[#8B7BEF] shadow-[0_0_30px_rgba(108,93,211,0.15)]'
                        : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-[#6C5DD3]/50 hover:bg-white/[0.07]'
                      }`}
                  >
                    {/* COMPACT VIEW: Minimal Thumbnail Only */}
                    {episodeView === 'compact' ? (
                      <>
                        {/* Compact Thumbnail */}
                        <div className={`relative w-full h-full overflow-hidden ${!hasRealThumbnail ? 'bg-gradient-to-br from-[#1A1A2E] to-[#0F0F1A]' : ''}`}>
                          <img
                            src={thumbnailUrl}
                            alt={`Episode ${epNum}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            style={!hasRealThumbnail ? {
                              filter: `hue-rotate(${(epNum * 15) % 360}deg) brightness(${0.7 + (epNum % 3) * 0.15})`,
                            } : {}}
                            loading="lazy"
                          />
                          
                          {/* Overlay Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          
                          {/* EP Number - Bottom Left */}
                          <div className="absolute bottom-2 left-2">
                            <span className="bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold text-white">
                              EP {epNum}
                            </span>
                          </div>
                          
                          {/* Status Icons - Top Right */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            {isLatest && (
                              <span className="bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">NEW</span>
                            )}
                            {isWatched && (
                              <div className="bg-green-500 rounded-full p-0.5">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          
                          {/* Progress Bar - Bottom */}
                          {isLastWatched && lastWatched.progress > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                              <div
                                className="h-full bg-[#6C5DD3]"
                                style={{ width: `${lastWatched.progress}%` }}
                              />
                            </div>
                          )}
                          
                          {/* Play Icon on Hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <Play className="w-8 h-8 text-white drop-shadow-lg" fill="white" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* COMFY VIEW: Full Card with Info */}
                        {/* Episode Thumbnail Container */}
                        <div className={`relative aspect-video sm:aspect-[16/10] overflow-hidden ${!hasRealThumbnail ? 'bg-gradient-to-br from-[#1A1A2E] to-[#0F0F1A]' : ''}`}>
                          {/* Episode thumbnail image */}
                          <img
                            src={thumbnailUrl}
                            alt={`Episode ${epNum}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            style={!hasRealThumbnail ? {
                              filter: `hue-rotate(${(epNum * 15) % 360}deg) brightness(${0.7 + (epNum % 3) * 0.15})`,
                            } : {}}
                            loading="lazy"
                          />
                          
                          {!hasRealThumbnail && (
                            <>
                              {/* Gradient Overlay */}
                              <div 
                                className="absolute inset-0 opacity-60"
                                style={{
                                  background: `linear-gradient(${135 + (epNum * 30) % 90}deg, ${['rgba(108,93,211,0.3)', 'rgba(234,179,8,0.3)', 'rgba(34,197,94,0.3)', 'rgba(239,68,68,0.3)'][epNum % 4]} 0%, transparent 60%)`
                                }}
                              />
                              {/* Episode Number Watermark */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-6xl sm:text-7xl font-bold text-white/[0.03] select-none">{epNum}</span>
                              </div>
                            </>
                          )}

                          {/* Status Badges - Top Left */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-white/10">
                                EP {epNum}
                              </span>
                              {isLatest && (
                                <span className="bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-black">
                                  NEW
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Watched Badge - Top Right */}
                          {isWatched && (
                            <div className="absolute top-3 right-3">
                              <div className="bg-green-500/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg shadow-green-500/30">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                              </div>
                            </div>
                          )}

                          {/* Play Button Overlay - Center */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-[#6C5DD3] flex items-center justify-center shadow-lg shadow-[#6C5DD3]/40 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                              <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                            </div>
                          </div>

                          {/* Duration Badge - Bottom Right */}
                          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-[11px] font-medium text-white/90 border border-white/10">
                            {anime.duration}
                          </div>

                          {/* Progress Bar - Bottom (if last watched) */}
                          {isLastWatched && lastWatched.progress > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
                              <div
                                className="h-full bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] rounded-r-full"
                                style={{ width: `${lastWatched.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Episode Info */}
                        <div className="p-3.5 flex-1 flex flex-col">
                          {/* Title / Status Row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              {episodeTitle ? (
                                <h4 className="text-sm font-medium text-white/90 line-clamp-1 group-hover:text-white transition-colors">
                                  {episodeTitle}
                                </h4>
                              ) : (
                                <h4 className="text-sm font-medium text-white/70">
                                  Episode {epNum}
                                </h4>
                              )}
                              {isLastWatched && lastWatched.progress > 0 && (
                                <p className="text-[11px] text-[#6C5DD3] mt-0.5">
                                  Tersisa {Math.round(100 - lastWatched.progress)}%
                                </p>
                              )}
                            </div>
                            
                            {/* Watch Toggle Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleEpisodeWatched(epNum);
                              }}
                              className={`flex-shrink-0 p-2 rounded-xl transition-all duration-200 ${isWatched
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:scale-105'
                                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white hover:scale-105'
                                }`}
                              title={isWatched ? 'Tandai belum ditonton' : 'Tandai sudah ditonton'}
                            >
                              {isWatched ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Status Tags */}
                          <div className="mt-auto flex items-center gap-1.5 flex-wrap">
                            {isLatest && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                Terbaru
                              </span>
                            )}
                            {isLastWatched && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6C5DD3]/10 border border-[#6C5DD3]/30 text-[#B7ABFF] text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#6C5DD3]" />
                                Terakhir Ditonton
                              </span>
                            )}
                            {isWatched && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px]">
                                <Check className="w-3 h-3" />
                                Selesai
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          {/* Characters Tab */}
          <TabsContent value="characters">
            <CharacterSection 
              characters={anime.characters} 
              malId={anime.malId}
            />
          </TabsContent>

          {/* Synopsis Tab */}
          <TabsContent value="synopsis">
            <div className="max-w-3xl">
              <p className={`text-white/70 leading-relaxed text-lg ${showFullSynopsis ? '' : 'line-clamp-6'}`}>
                {anime.synopsis}
              </p>
              {anime.synopsis && anime.synopsis.length > 300 && (
                <button
                  onClick={() => setShowFullSynopsis(prev => !prev)}
                  className="mt-3 text-sm text-[#6C5DD3] hover:text-[#00C2FF] transition-colors"
                >
                  {showFullSynopsis ? 'Tutup' : 'Selengkapnya'}
                </button>
              )}
              {/* Info Cards - Mobile: Full Width Stacked */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex sm:block items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/[0.02] rounded-xl border border-white/5">
                  <p className="text-white/50 text-sm sm:mb-1">Status</p>
                  <p className="text-white font-medium flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${anime.status === 'Ongoing' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    {anime.status}
                  </p>
                </div>
                <div className="flex sm:block items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/[0.02] rounded-xl border border-white/5">
                  <p className="text-white/50 text-sm sm:mb-1">Studio</p>
                  <p className="text-white font-medium line-clamp-1">{anime.studio || '-'}</p>
                </div>
                <div className="flex sm:block items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/[0.02] rounded-xl border border-white/5">
                  <p className="text-white/50 text-sm sm:mb-1">Tahun Rilis</p>
                  <p className="text-white font-medium">{anime.releasedYear}</p>
                </div>
                <div className="flex sm:block items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/[0.02] rounded-xl border border-white/5">
                  <p className="text-white/50 text-sm sm:mb-1">Total Episode</p>
                  <p className="text-white font-medium">{anime.episodes} EP</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Related Tab */}
          <TabsContent value="related">
            {relatedAnime.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {relatedAnime.map((related, index) => (
                  <AnimeCard key={related.id} anime={related} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/50">Tidak ada anime terkait ditemukan.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Comment Section */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl">
            <CommentSection animeId={anime.id} title="Komentar Anime" size="sm" />
          </div>
        </div>
      </section>

      {/* More Anime Section */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold font-heading text-white mb-6">
            Anime Lainnya
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {animeList
              .filter(a => a.id !== anime.id)
              .slice(0, 6)
              .map((related, index) => (
                <AnimeCard key={related.id} anime={related} index={index} />
              ))}
          </div>
        </div>
      </section>


    </main>
  );
}
