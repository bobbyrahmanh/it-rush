
import Reveal from "@/components/Reveal";
import { BookOpen, Send, Users } from "react-feather";

function ChatBubble({
  children,
  time,
  variant = "received",
}: {
  children: React.ReactNode;
  time: string;
  variant?: "received" | "sent";
}) {
  return (
    <div
      className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
        variant === "sent"
          ? "ml-auto rounded-tr-sm bg-[#D9FDD3] text-[#214B2A]"
          : "rounded-tl-sm bg-white text-ink"
      }`}
    >
      <p className="text-sm leading-snug">{children}</p>
      <div className="mt-1 text-right text-[10px] opacity-60">
        {time} {variant === "sent" && "✓✓"}
      </div>
    </div>
  );
}

export default function EnvironmentalSection() {
  return (
    <section className="overflow-hidden border-y-2 sm:border-y-4 border-ink bg-sun py-10 sm:py-20 mb-6 sm:mb-10">
      <Reveal className="mx-auto max-w-6xl px-4">
        {/* SECTION INTRO */}
        <div className="mb-6 sm:mb-10">
          <span className="inline-block rounded-full border-2 border-ink bg-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold">
            INCLUSIVE COMMUNICATION
          </span>

          <h2 className="mt-3 sm:mt-5 text-2xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Informasi penting harus bisa dipahami{" "}
            <span className="relative inline-block">
              semua orang.
              <span className="absolute -bottom-1 left-0 -z-10 h-2.5 sm:h-3 w-full -rotate-1 bg-mint" />
            </span>
          </h2>

          <p className="mt-2.5 sm:mt-4 text-sm leading-relaxed sm:text-lg sm:leading-snug">
            Kepedulian terhadap masyarakat dan lingkungan juga dimulai dari
            akses informasi yang setara. Namun, apakah setiap orang sudah
            memiliki kesempatan yang sama untuk memahami informasi?
          </p>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid items-center gap-6 sm:gap-10 lg:grid-cols-2 lg:gap-14">
          {/* LEFT: CHAT SIMULATION */}
          <div className="relative mx-auto w-full max-w-md">
            <div
              aria-hidden="true"
              className="absolute -left-3 -top-3 sm:-left-4 sm:-top-4 h-12 w-12 sm:h-16 sm:w-16 rounded-full border-2 sm:border-4 border-ink bg-coral"
            />

            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-ink bg-[#E8EDE7] shadow-pop">
              {/* CHAT HEADER */}
              <div className="flex items-center gap-2.5 sm:gap-3 border-b-2 sm:border-b-4 border-ink bg-grape px-3.5 sm:px-5 py-3 sm:py-4 text-white">
                <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white bg-mint text-ink">
                  <Users size={18} className="sm:h-5 sm:w-5" />
                </div>

                <div className="flex-1">
                  <p className="text-sm sm:text-base font-bold">Komunitas Warga</p>
                  <p className="text-[11px] sm:text-xs text-white/75">
                    3 anggota sedang aktif
                  </p>
                </div>

                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-mint" />
              </div>

              {/* CHAT BODY */}
              <div className="flex min-h-[280px] sm:min-h-[330px] flex-col gap-3 sm:gap-4 p-3.5 sm:p-5">
                <div className="mx-auto rounded-full bg-white/80 px-3 py-0.5 text-[9px] sm:text-[10px] font-bold text-ink/50">
                  HARI INI
                </div>

                <div className="chat-message chat-delay-1">
                  <ChatBubble time="09.12">
                    Besok ada kegiatan bersih pantai. Informasinya sudah
                    dibagikan di grup warga.
                  </ChatBubble>
                </div>

                <div className="chat-message chat-delay-2">
                  <ChatBubble time="09.13">
                    Tapi pengumumannya hanya berupa pesan suara. Bagaimana
                    teman-teman yang tidak bisa mengakses audio?
                  </ChatBubble>
                </div>

                <div className="chat-message chat-delay-3">
                  <ChatBubble time="09.14" variant="sent">
                    Benar juga. Informasi penting seharusnya bisa dipahami
                    dengan berbagai cara.
                  </ChatBubble>
                </div>

                <div className="chat-message chat-delay-4">
                  <div className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2 rounded-full border-2 border-ink/10 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs text-ink/40">
                  <span className="flex-1 text-[11px] sm:text-xs">Pesan simulasi...</span>
                  <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-mint text-ink">
                    <Send size={13} />
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-ink/10 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-center text-[9px] sm:text-[10px] font-semibold text-ink/50">
                Ilustrasi situasi komunikasi di masyarakat
              </div>
            </div>

            <div
              aria-hidden="true"
              className="hidden sm:block absolute -bottom-4 right-4 md:right-8 rotate-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-ink bg-coral px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-bold shadow-popsm"
            >
              Everyone matters!
            </div>
          </div>

          {/* RIGHT: EXPLANATION */}
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <span className="inline-block rounded-full border-2 border-ink bg-mint px-3 py-1 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold">
                WHY INCLUSION MATTERS
              </span>

              <h3 className="mt-3 sm:mt-5 text-xl sm:text-3xl md:text-4xl font-bold leading-snug">
                Bukan hanya menyampaikan informasi, tetapi memastikan semua
                orang punya kesempatan untuk memahaminya.
              </h3>

              <p className="mt-2.5 sm:mt-4 text-xs sm:text-base leading-relaxed sm:leading-snug text-ink/85">
                Dalam berbagai kegiatan masyarakat, informasi mengenai
                kesehatan, pendidikan, hingga lingkungan perlu disampaikan
                dengan memperhatikan keberagaman cara berkomunikasi.
              </p>

              <p className="mt-2 sm:mt-3 text-xs sm:text-base leading-relaxed sm:leading-snug text-ink/85">
                Inilah semangat yang dibawa SIGNIFY: mengajak masyarakat
                mengenal BISINDO dan Braille sebagai langkah awal membangun
                komunikasi yang lebih inklusif.
              </p>
            </div>

            {/* SIGNIFY VISUAL */}
            <div className="rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-ink bg-sky p-3.5 sm:p-6 shadow-popsm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold tracking-wide">
                    GET TO KNOW SIGNIFY
                  </p>
                  <h4 className="mt-0.5 sm:mt-1 text-base sm:text-xl font-bold">
                    Dua cara belajar, satu tujuan.
                  </h4>
                </div>

                <BookOpen size={24} className="sm:h-7 sm:w-7" />
              </div>

              <div className="mt-3.5 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-3">
                {/* BISINDO */}
                <div className="signify-visual-card rounded-xl sm:rounded-2xl border-2 border-ink bg-white p-3 sm:p-4">
                  <div className="flex h-10 sm:h-14 items-center justify-center rounded-lg sm:rounded-xl bg-mint">
                    <span className="font-display text-lg sm:text-2xl font-bold">✌️</span>
                  </div>

                  <p className="mt-2 sm:mt-3 font-bold text-xs sm:text-base">BISINDO</p>
                  <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs leading-relaxed text-ink/65">
                    Kenali alfabet melalui gestur tangan.
                  </p>
                </div>

                {/* BRAILLE */}
                <div className="signify-visual-card rounded-xl sm:rounded-2xl border-2 border-ink bg-white p-3 sm:p-4">
                  <div className="flex h-10 sm:h-14 items-center justify-center rounded-lg sm:rounded-xl bg-coral">
                    <span className="font-display text-2xl sm:text-4xl font-bold">
                      ⠿
                    </span>
                  </div>

                  <p className="mt-2 sm:mt-3 font-bold text-xs sm:text-base">BRAILLE</p>
                  <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs leading-relaxed text-ink/65">
                    Pahami pola enam titik secara interaktif.
                  </p>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 rounded-xl border-2 border-ink bg-grape px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white">
                Belajar memahami, mulai dari diri sendiri.
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
