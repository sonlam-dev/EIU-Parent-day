export type Wish = { id: string; name: string; recipient: string; message: string; color: string; status: 'pending' | 'approved' | 'rejected'; created_at: string; source?: 'guest' | 'emergency' };
export const colors = [
  { id: 'green', hex: '#68843b', label: 'Biết ơn' },
  { id: 'gold', hex: '#c4ab50', label: 'Hạnh phúc' },
  { id: 'pink', hex: '#c77a98', label: 'Yêu thương' },
  { id: 'sage', hex: '#70a99d', label: 'Bình an' },
];
