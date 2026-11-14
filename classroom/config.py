"""Local CAT-SOOP configuration. Runtime data is never committed."""
import os
from pathlib import Path
_root = Path(__file__).resolve().parent
cs_data_root = str(Path(os.environ.get('GUBBER_DATA', str(_root/'runtime'))).resolve())
cs_url_root = os.environ.get('GUBBER_ORIGIN', 'http://localhost:7667').rstrip('/')+'/learn'
cs_title = 'Gubber Classroom'
cs_header = 'Gubber Classroom'
cs_icon_url = '/assets/favicon.svg'
cs_base_color = '#173e33'
cs_main_page_text = 'Sample courses for future work. All content is placeholder material.'
cs_auth_type = 'login'
cs_view_without_auth = True
cs_log_encryption = False  # Local development only. Set up encrypted storage before real enrollment.
cs_log_compression = True
