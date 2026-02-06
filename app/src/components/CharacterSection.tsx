import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mic2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { Character } from '@/data/animeData';

interface CharacterSectionProps {
  characters?: Character[];
  malId?: number;
}

interface JikanCharacter {
  character: {
    mal_id: number;
    name: string;
    images: {
      jpg: {
        image_url: string;
      };
    };
  };
  role: string;
  voice_actors: Array<{
    person: {
      mal_id: number;
      name: string;
      images: {
        jpg: {
          image_url: string;
        };
      };
    };
    language: string;
  }>;
}

export default function CharacterSection({ characters: propCharacters, malId }: CharacterSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'All' | 'Main' | 'Supporting'>('All');
  const [characters, setCharacters] = useState<Character[]>(propCharacters || []);
  const [loading, setLoading] = useState(false);

  // Fetch from Jikan API if malId is provided and no prop characters
  useEffect(() => {
    if (propCharacters && propCharacters.length > 0) return;
    if (!malId) return;

    const fetchCharacters = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}/characters`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const mappedCharacters: Character[] = data.data
            .slice(0, 20) // Limit to 20 characters
            .map((item: JikanCharacter) => {
              const japaneseVA = item.voice_actors?.find(va => 
                va.language === 'Japanese'
              );
              
              return {
                id: `char-${item.character.mal_id}`,
                name: item.character.name,
                role: item.role === 'Main' ? 'Main' : 'Supporting',
                image: item.character.images.jpg.image_url,
                voiceActor: japaneseVA ? {
                  name: japaneseVA.person.name,
                  image: japaneseVA.person.images?.jpg?.image_url,
                } : undefined,
              };
            });
          
          setCharacters(mappedCharacters);
        }
      } catch (err) {
        console.error('Error fetching characters:', err);
        // Silently fail - section won't show if no characters
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [malId, propCharacters]);

  if (!loading && characters.length === 0) {
    return null;
  }

  const filteredCharacters = selectedRole === 'All' 
    ? characters 
    : characters.filter(c => c.role === selectedRole);

  const displayCharacters = showAll ? filteredCharacters : filteredCharacters.slice(0, 8);
  const hasMore = filteredCharacters.length > 8;

  const mainCount = characters.filter(c => c.role === 'Main').length;
  const supportingCount = characters.filter(c => c.role === 'Supporting').length;

  // Loading skeleton
  if (loading) {
    return (
      <section className="mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
          <div>
            <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-24 bg-white/5 rounded mt-1 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-pulse">
              <div className="w-16 h-16 rounded-xl bg-white/10" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-white/10 rounded" />
                <div className="h-3 w-16 bg-white/5 rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Karakter & Pengisi Suara</h3>
            <p className="text-xs text-white/50">
              {characters.length} karakter
              {!propCharacters?.length && malId && (
                <span className="inline-flex items-center gap-1 ml-2 text-[#6C5DD3]">
                  <Sparkles className="w-3 h-3" />
                  Auto-generated
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
          {(['All', 'Main', 'Supporting'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedRole === role
                  ? 'bg-[#6C5DD3] text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {role === 'All' && `Semua (${characters.length})`}
              {role === 'Main' && `Utama (${mainCount})`}
              {role === 'Supporting' && `Pendukung (${supportingCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {displayCharacters.map((character, index) => (
            <motion.div
              key={character.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="group relative flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/10 hover:border-[#6C5DD3]/30 hover:bg-white/[0.07] transition-all cursor-pointer"
            >
              {/* Character Image */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(character.name)}&background=6C5DD3&color=fff&size=128`;
                    }}
                  />
                </div>
                {/* Role Badge */}
                <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                  character.role === 'Main' 
                    ? 'bg-[#6C5DD3] text-white' 
                    : 'bg-white/20 text-white/80'
                }`}>
                  {character.role === 'Main' ? 'UTAMA' : 'PENDUKUNG'}
                </span>
              </div>

              {/* Character Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#B7ABFF] transition-colors">
                  {character.name}
                </h4>
                {character.nameJp && (
                  <p className="text-[10px] text-white/40 truncate">{character.nameJp}</p>
                )}
                
                {/* Voice Actor */}
                {character.voiceActor && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Mic2 className="w-3 h-3 text-white/30" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-white/60 truncate">
                        {character.voiceActor.name}
                      </p>
                      {character.voiceActor.nameJp && (
                        <p className="text-[9px] text-white/30 truncate">
                          {character.voiceActor.nameJp}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* VA Image (if available) */}
              {character.voiceActor && (
                <div className="hidden sm:block flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <img
                    src={character.voiceActor.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(character.voiceActor.name)}&background=00C2FF&color=fff&size=64`}
                    alt={character.voiceActor.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(character.voiceActor!.name)}&background=00C2FF&color=fff&size=64`;
                    }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm text-white/70 hover:text-white"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Tampilkan Lebih Sedikit
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Lihat Semua ({filteredCharacters.length} Karakter)
            </>
          )}
        </motion.button>
      )}
    </section>
  );
}
