// import { X } from 'lucide-react';

// export default function CustomToast({ t, message, type, toast }) {
//     const colors = {
//         success: {
//             bg: 'bg-green-100',
//             text: 'text-green-700',
//             border: 'border-green-500',
//             icon: '✅',
//             track: 'bg-green-500'
//         },
//         error: {
//             bg: 'bg-red-100',
//             text: 'text-red-700',
//             border: 'border-red-500',
//             icon: '❌',
//             track: 'bg-red-500'
//         },
//         info: {
//             bg: 'bg-blue-100',
//             text: 'text-blue-700',
//             border: 'border-blue-500',
//             icon: 'ℹ️',
//             track: 'bg-blue-500'
//         },
//         warning: {
//             bg: 'bg-orange-100',
//             text: 'text-orange-700',
//             border: 'border-orange-500',
//             icon: '⚠️',
//             track: 'bg-orange-500'
//         }
//     };

//     const style = colors[type] || colors.info;

//     return (
//         <div
//             className={`${style.bg} ${style.text} px-4 py-3 rounded-lg shadow-lg border relative w-[280px] ${style.border}`}
//         >
//             <div className="flex items-start gap-3">
//                 <span className="text-xl">{style.icon}</span>
//                 <div className="text-sm font-medium">{message}</div>
//                 <button onClick={() => toast.dismiss(t.id)} className="ml-auto text-xl">
//                     <X className="w-4 h-4" />
//                 </button>
//             </div>
//             <div className={`h-1 mt-2 rounded-full ${style.track} w-full animate-pulse`} />
//         </div>
//     );
// }
