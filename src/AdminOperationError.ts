type OperationError={code?:string;message?:string};
export function adminOperationError(error:OperationError) {
  const code=error.code || 'NETWORK';
  if(['PGRST202','42883'].includes(code)) return 'Chưa cài chức năng này. Chạy migration 003_admin_operations.sql trong Supabase SQL Editor.';
  if(code==='42501') return 'Tài khoản không có quyền thực hiện. Vui lòng kiểm tra quyền admin. [42501]';
  if(code==='21000' && /WHERE clause/i.test(error.message || '')) return 'Supabase chặn lệnh xóa thiếu điều kiện. Chạy 004_fix_admin_delete.sql trong SQL Editor rồi thử lại. [21000]';
  if(['PGRST301','PGRST303'].includes(code)) return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Đăng xuất rồi đăng nhập lại. ['+code+']';
  const message=(error.message || 'Không nhận được phản hồi từ máy chủ.').slice(0,350);
  return `Không thực hiện được [${code}]: ${message}`;
}
