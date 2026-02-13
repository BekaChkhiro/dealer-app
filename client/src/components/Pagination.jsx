import { Pagination as MuiPagination } from '@mui/material';
import { useTranslation } from '../context/LanguageContext';
import './Pagination.css';

const LIMIT_OPTIONS = [10, 20, 30, 50];

export default function Pagination({
  page = 1,
  total = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
}) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(total / limit) || 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  function handleLimitChange(e) {
    if (onLimitChange) onLimitChange(Number(e.target.value));
  }

  function handlePageChange(_e, value) {
    if (onPageChange) onPageChange(value);
  }

  return (
    <div className="pg-bar">
      <div className="pg-left">
        <span className="pg-info">
          {t('common.showing')} {from} {t('common.of')} {to}
        </span>
        <span className="pg-total">{t('common.total')}: {total}</span>
        <span className="pg-show">
          {t('common.show')}:
          <select
            className="pg-select"
            value={limit}
            onChange={handleLimitChange}
          >
            {LIMIT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </span>
      </div>

      <div className="pg-right">
        <MuiPagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          shape="circular"
          size="small"
          sx={{
            '& .MuiPaginationItem-root': {
              width: 32,
              height: 32,
              minWidth: 32,
              borderRadius: '16px',
              fontSize: '14px',
              fontFamily: 'inherit',
            },
            '& .Mui-selected': {
              backgroundColor: 'rgba(0,0,0,0.08) !important',
            },
          }}
        />
      </div>
    </div>
  );
}
