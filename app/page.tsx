"use client";

import React, { useState } from "react";
import "./game.css";

export default function Home() {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const [combinations, setCombinations] = useState<any[]>([]);
  const [createdList, setCreatedList] = useState<any[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Données des éléments chimiques
  const gridData = [
    { id: 1, name: "Hydrogène", symbol: "H", atomicNumber: 1 },
    { id: 2, name: "Oxygène", symbol: "O", atomicNumber: 8 },
    { id: 3, name: "Sodium", symbol: "Na", atomicNumber: 11 },
    { id: 4, name: "Chlore", symbol: "Cl", atomicNumber: 17 },
    { id: 5, name: "Carbone", symbol: "C", atomicNumber: 6 },
    { id: 6, name: "Calcium", symbol: "Ca", atomicNumber: 20 },
    { id: 7, name: "Azote", symbol: "N", atomicNumber: 7 },
    { id: 8, name: "Soufre", symbol: "S", atomicNumber: 16 },
    { id: 9, name: "Silicium", symbol: "Si", atomicNumber: 14 },
    { id: 10, name: "Fer", symbol: "Fe", atomicNumber: 26 },
    { id: 11, name: "Magnésium", symbol: "Mg", atomicNumber: 12 },
    { id: 12, name: "Fluor", symbol: "F", atomicNumber: 9 },
    { id: 13, name: "Potassium", symbol: "K", atomicNumber: 19 },
    { id: 14, name: "Cuivre", symbol: "Cu", atomicNumber: 29 },
  ];

  const [selectedCell, setSelectedCell] = useState<{ id: number; name: string; symbol: string; atomicNumber: number } | null>(null);
  const [draggedCell, setDraggedCell] = useState<{ id: number; name: string; symbol: string; atomicNumber: number } | null>(null);
  const [droppedItems, setDroppedItems] = useState<{ id: number; name: string; symbol: string; atomicNumber: number; x: number; y: number }[]>([]);

  // Charger les combinaisons au démarrage
  React.useEffect(() => {
    fetch("/combinaisons.json")
      .then((res) => res.json())
      .then((data) => setCombinations(data));
  }, []);

  const addToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);

    // Supprimer le toast après 3 secondes
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const handleCellClick = (item: { id: number; name: string; symbol: string; atomicNumber: number; }, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    // Ajouter l'élément à la zone de jeu
    const newItems = [...droppedItems, { ...item, x: 0, y: 0 }];
    setDroppedItems(newItems);
    checkValidCombination(newItems);
  };

  const handleDragStart = (item: { id: number; name: string; symbol: string; atomicNumber: number }, e: React.DragEvent<HTMLDivElement>) => {
    setDraggedCell(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedCell !== null) {
      const newItems = [...droppedItems, { ...draggedCell, x: e.clientX, y: e.clientY }];
      setDroppedItems(newItems);
      setDraggedCell(null);

      // Vérifier si c'est une combinaison valide
      checkValidCombination(newItems);
    }
  };

  const handleRemoveItem = (id: number) => {
    setDroppedItems(droppedItems.filter((item) => item.id !== id));
  };

  const checkValidCombination = (items: { id: number; name: string; symbol: string; atomicNumber: number; x: number; y: number }[]) => {
    // Extraire les noms des éléments déposés
    const droppedNames = items.map((item) => item.name).sort();

    // Chercher une combinaison correspondante
    const found = combinations.find((combo: any) => {
      const comboElements = [...combo.elements].sort();
      return (
        droppedNames.length === comboElements.length &&
        droppedNames.every((name, index) => name === comboElements[index])
      );
    });

    if (found) {
      // Vérifier si la création est déjà enregistrée
      const already = createdList.some((c) => c.formule === found.formule && c.matiere === found.matiere);
      if (!already) {
        setCreatedList((prev) => [...prev, found]);
        addToast(`✓ Excellent ! ${found.matiere} (${found.formule}) créé !`);
      } else {
        addToast(`ℹ️ ${found.matiere} déjà créé.`);
      }

      // Réinitialiser les éléments déposés après 1 seconde
      setTimeout(() => {
        setDroppedItems([]);
      }, 1000);
    }
  };

  // Progression dynamique calculée à partir des créations
  const levelProgress = React.useMemo(() => {
    if (!combinations || combinations.length === 0) return 0;
    const val = Math.round((createdList.length / combinations.length) * 100);
    return Math.min(100, val);
  }, [createdList, combinations]);

  return (
    <div className="game-container">
      {/* Barre de progression du niveau en haut */}
      <div className="level-bar">
        <div className="level-bar-content">
          <span className="level-label">Niveau 1</span>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${levelProgress}%` }}>
              <span className="progress-text">{levelProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteneur des toasts */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-notification">
            {toast.message}
          </div>
        ))}
      </div>

      {/* Panneau gauche rétractable (par défaut caché) et languette */}
      <div className={`left-panel ${isPanelOpen ? "open" : ""}`}>
        <div className="panel-header">
          <h3>Tableau des créations</h3>
          <button className="close-panel" onClick={() => setIsPanelOpen(false)}>×</button>
        </div>
        <div className="creations-list">
          {createdList.length === 0 ? (
            <div className="empty">Aucune création</div>
          ) : (
            createdList.map((c, idx) => (
              <div key={idx} className="creation-item">
                <div className="creation-icon">{c.icon || "🔬"}</div>
                <div className="creation-info">
                  <div className="creation-name">{c.matiere}</div>
                  <div className="creation-formule">{c.formule}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <button className="panel-tab" onClick={() => setIsPanelOpen((s) => !s)}>Tableau des créations</button>

      {/* Conteneur principal du jeu */}
      <div className="game-content">
        {/* Zone de jeu principale */}
        <div className="main-game-area" onDragOver={handleDragOver} onDrop={handleDrop}>
          {droppedItems.length === 0 ? (
            <div className="game-info">Déposez les éléments ici</div>
          ) : (
            <div className="dropped-items-container">
              {droppedItems.map((item) => (
                <div
                  key={item.id}
                  className="dropped-item"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <div className="dropped-item-content">
                    <div className="dropped-item-name">{item.name}</div>
                    <div className="dropped-item-value">{item.symbol}</div>
                  </div>
                  <button className="remove-btn">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne de droite avec grille de données */}
        <div className="side-panel">
          <h3 className="panel-title">Éléments (Cliquer pour ajouter)</h3>
          <div className="data-grid">
            {gridData.map((item) => (
              <div
                key={item.id}
                className={`grid-cell ${selectedCell?.id === item.id ? "selected" : ""}`}
                onClick={(e) => handleCellClick(item, e)}
                draggable
                onDragStart={(e) => handleDragStart(item, e)}
              >
                <div className="cell-symbol">{item.symbol}</div>
                <div className="cell-name">{item.name}</div>
                <div className="cell-atomic">{item.atomicNumber}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
