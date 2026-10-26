export type Wish = { id: string; name: string; recipient: string; message: string; color: string; status: 'pending' | 'approved' | 'rejected'; created_at: string };
export const colors = [
  { id: 'green', hex: '#68843b', label: 'Biết ơn' },
  { id: 'gold', hex: '#c4ab50', label: 'Hạnh phúc' },
  { id: 'pink', hex: '#b97c39', label: 'Yêu thương' },
  { id: 'sage', hex: '#8c984c', label: 'Bình an' },
];
