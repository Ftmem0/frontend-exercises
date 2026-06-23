type AppHeaderProps = {
  darkMode: boolean;
  onToggleTheme: () => void;
  onResetLocalData: () => void;
};

export function AppHeader({ darkMode, onToggleTheme, onResetLocalData }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Postman Beta</p>
        <h1>API Client</h1>
        
      </div>
      <div className="header-actions">
        <button className="secondary-button" type="button" onClick={onToggleTheme}>
          {darkMode ? ' Light' : ' Dark'}
        </button>
        <button className="ghost-button" type="button" onClick={onResetLocalData}>
          Reset local data
        </button>
      </div>
    </header>
  );
}
