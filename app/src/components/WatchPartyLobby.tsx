import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Tv, 
  Clock,
  Globe,
  Play
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { BACKEND_URL } from '@/config/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface WatchPartyRoom {
  roomId: string;
  animeId: string;
  animeTitle: string;
  episodeNumber: number;
  participantCount: number;
  maxParticipants: number;
  createdAt: string;
}

interface WatchPartyLobbyProps {
  onJoinRoom: (roomId: string) => void;
  onCreateRoom?: () => void;
}

export default function WatchPartyLobby({ onJoinRoom, onCreateRoom }: WatchPartyLobbyProps) {
  const [rooms, setRooms] = useState<WatchPartyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/watchparty/rooms`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setIsSearching(true);
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/watchparty/rooms/${searchCode.trim().toUpperCase()}`);
      if (res.ok) {
        const room = await res.json();
        if (room.isFull) {
          toast({
            title: 'Room Full',
            description: 'This room has reached maximum participants',
            variant: 'destructive'
          });
        } else {
          onJoinRoom(room.roomId);
        }
      } else {
        toast({
          title: 'Room Not Found',
          description: 'The room code you entered does not exist',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to search for room',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C5DD3]/10 rounded-full mb-6"
          >
            <Users className="w-5 h-5 text-[#6C5DD3]" />
            <span className="text-[#6C5DD3] font-medium">Watch Party</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Nonton Bareng Teman
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 max-w-2xl mx-auto"
          >
            Buat ruang nonton virtual dan ajak temanmu menonton anime bersama-sama. 
            Chat realtime dan sinkronisasi video otomatis.
          </motion.p>
        </div>

        {/* Search & Create */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          {/* Join Room */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#6C5DD3]/20 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-[#6C5DD3]" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Join Room</h3>
                <p className="text-white/50 text-sm">Masuk dengan kode ruangan</p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="Masukkan kode (contoh: ABC123)"
                maxLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3] font-mono text-center tracking-wider"
              />
              <Button
                type="submit"
                disabled={isSearching || searchCode.length < 6}
                className="w-full bg-[#6C5DD3] hover:bg-[#5B4EC2]"
              >
                {isSearching ? 'Searching...' : 'Join Room'}
              </Button>
            </form>
          </div>

          {/* Create Room */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Buat Room</h3>
                <p className="text-white/50 text-sm">Jadi host dan ajak teman</p>
              </div>
            </div>

            <p className="text-white/60 text-sm mb-4">
              Buat ruang nonton baru dari halaman anime yang ingin ditonton. 
              Kamu akan menjadi host dan bisa mengontrol pemutaran video.
            </p>

            <Button
              onClick={onCreateRoom}
              variant="outline"
              className="w-full border-white/10 hover:bg-white/5"
            >
              <Tv className="w-4 h-4 mr-2" />
              Pilih Anime
            </Button>
          </div>
        </motion.div>

        {/* Active Rooms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Room Aktif</h2>
            <button
              onClick={fetchRooms}
              className="text-sm text-[#6C5DD3] hover:text-white transition-colors"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#6C5DD3] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Belum ada room aktif</p>
              <p className="text-white/40 text-sm mt-1">Jadilah yang pertama membuat room!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room, index) => (
                <motion.div
                  key={room.roomId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => onJoinRoom(room.roomId)}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-[#6C5DD3]/50 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#6C5DD3]/20 rounded-lg flex items-center justify-center">
                        <Play className="w-4 h-4 text-[#6C5DD3]" />
                      </div>
                      <span className="text-[#6C5DD3] font-mono font-medium">{room.roomId}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/40 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{room.participantCount}/{room.maxParticipants}</span>
                    </div>
                  </div>

                  <h3 className="text-white font-medium mb-1 line-clamp-1 group-hover:text-[#6C5DD3] transition-colors">
                    {room.animeTitle}
                  </h3>
                  <p className="text-white/50 text-sm mb-3">Episode {room.episodeNumber}</p>

                  <div className="flex items-center gap-1 text-white/30 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(room.createdAt)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 grid md:grid-cols-3 gap-6"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-[#6C5DD3]/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Play className="w-6 h-6 text-[#6C5DD3]" />
            </div>
            <h3 className="text-white font-semibold mb-2">Sinkronisasi Video</h3>
            <p className="text-white/50 text-sm">Video otomatis tersinkronisasi untuk semua peserta room</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-[#6C5DD3]/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-[#6C5DD3]" />
            </div>
            <h3 className="text-white font-semibold mb-2">Hingga 10 Peserta</h3>
            <p className="text-white/50 text-sm">Ajak hingga 9 teman untuk nonton bareng dalam satu room</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-[#6C5DD3]/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-[#6C5DD3]" />
            </div>
            <h3 className="text-white font-semibold mb-2">Chat Realtime</h3>
            <p className="text-white/50 text-sm">Diskusi dan bereaksi bersama saat menonton</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
