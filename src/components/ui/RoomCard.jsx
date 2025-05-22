// import { motion, AnimatePresence } from 'framer-motion';
// import {
//     ClipboardCheck, Copy, CheckCircle, Hourglass, PauseCircle,
//     BadgeCheck, UserCheck
// } from 'lucide-react';

// export default function RoomCard({
//     room,
//     index,
//     isExpanded,
//     onToggle,
//     onJoin,
//     onDeactivate,
//     onCopy,
//     copied,
//     detail,
//     loadingDetail
// }) {
//     return (
//         <div className="card">
//             {/* Header */}
//             <div className="cursor-pointer" onClick={() => onToggle(index)}>
//                 <div className="flex justify-between items-start md:items-center gap-4">
//                     <div>
//                         <h3 className="font-semibold text-lg">{room.roomName}</h3>
//                         <div className="status-text flex items-center gap-1 mt-1">
//                             {room.votingStarted ? (
//                                 room.votingEnded ? (
//                                     <>
//                                         <CheckCircle className="w-4 h-4 text-purple-500" />
//                                         Voting Ended
//                                     </>
//                                 ) : (
//                                     <>
//                                         <Hourglass className="w-4 h-4 text-blue-500 animate-pulse" />
//                                         Voting Open
//                                     </>
//                                 )
//                             ) : (
//                                 <>
//                                     <PauseCircle className="w-4 h-4 text-gray-400" />
//                                     Not Started
//                                 </>
//                             )}
//                         </div>
//                         <div className="mt-2 text-xs flex flex-wrap gap-2">
//                             {room.isCreator && (
//                                 <span className="role-badge">
//                                     <BadgeCheck className="w-4 h-4" />
//                                     You are the creator
//                                 </span>
//                             )}
//                             {room.isVoter && !room.isCreator && (
//                                 <span className="role-badge">
//                                     <UserCheck className="w-4 h-4" />
//                                     You are a voter
//                                 </span>
//                             )}
//                         </div>
//                     </div>
//                     <div className="flex gap-2" onClick={e => e.stopPropagation()}>
//                         <button onClick={() => onJoin(room.address)} className="btn-primary">Join</button>
//                         {room.isCreator && (
//                             <button onClick={() => onDeactivate(room.address)} className="btn-danger">Deactivate</button>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Expand Detail */}
//             <AnimatePresence>
//                 {isExpanded && (
//                     <motion.div
//                         initial={{ opacity: 0, height: 0 }}
//                         animate={{ opacity: 1, height: 'auto' }}
//                         exit={{ opacity: 0, height: 0 }}
//                         className="overflow-hidden mt-3 space-y-1 text-sm text-muted"
//                     >
//                         <div className="flex items-center gap-2 font-mono text-xs">
//                             {room.address}
//                             <button onClick={(e) => { e.stopPropagation(); onCopy(room.address); }} className="hover:text-cyberblue">
//                                 {copied === room.address
//                                     ? <ClipboardCheck className="w-4 h-4 text-green-500" />
//                                     : <Copy className="w-4 h-4" />}
//                             </button>
//                         </div>
//                         {loadingDetail ? (
//                             <p className="text-sm opacity-60">Loading details...</p>
//                         ) : (
//                             <>
//                                 {detail?.description && <p><strong>Description:</strong> {detail.description}</p>}
//                                 <p><strong>Room Admin:</strong> {detail?.roomAdmin || '-'}</p>
//                                 <p><strong>Super Admin:</strong> {detail?.superAdmin || '-'}</p>
//                                 <p><strong>Factory:</strong> {detail?.factory || '-'}</p>
//                                 <p><strong>Max Voters:</strong> {detail?.maxVoters || '-'}</p>
//                                 <p><strong>Current Voters:</strong> {room.votersCount}</p>
//                                 <p><strong>Number of Candidates:</strong> {room.candidatesCount}</p>
//                             </>
//                         )}
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//         </div>
//     );
// }
