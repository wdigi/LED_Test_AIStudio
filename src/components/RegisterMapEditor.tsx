import React, { useState } from 'react';
import { Plus, Trash2, Key, Sliders, CheckCircle, HelpCircle } from 'lucide-react';
import { I2CRegister, SensorConfig } from '../types/library';

interface RegisterMapEditorProps {
  config: SensorConfig;
  onUpdateConfig: (updated: Partial<SensorConfig>) => void;
}

export const RegisterMapEditor: React.FC<RegisterMapEditorProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [activeRegId, setActiveRegId] = useState<string>(config.registers[0]?.id || '');
  const [newRegName, setNewRegName] = useState('');
  const [newRegAddr, setNewRegAddr] = useState('0x10');
  const [newRegDesc, setNewRegDesc] = useState('');

  const activeReg = config.registers.find((r) => r.id === activeRegId) || config.registers[0];

  const handleAddRegister = () => {
    if (!newRegName.trim()) return;
    const cleanName = newRegName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const newReg: I2CRegister = {
      id: `reg_${Date.now()}`,
      name: cleanName,
      address: newRegAddr.startsWith('0x') ? newRegAddr : `0x${newRegAddr}`,
      description: newRegDesc.trim() || 'Custom device register',
      isReadOnly: false,
      defaultValue: '0x00',
      bitWidth: 8,
      isSigned: false,
    };

    const updated = [...config.registers, newReg];
    onUpdateConfig({ registers: updated });
    setActiveRegId(newReg.id);
    setNewRegName('');
    setNewRegDesc('');
  };

  const handleRemoveRegister = (id: string) => {
    if (config.registers.length <= 1) return;
    const updated = config.registers.filter((r) => r.id !== id);
    onUpdateConfig({ registers: updated });
    if (activeRegId === id) {
      setActiveRegId(updated[0]?.id || '');
    }
  };

  const handleUpdateActiveRegister = (fields: Partial<I2CRegister>) => {
    if (!activeReg) return;
    const updated = config.registers.map((r) =>
      r.id === activeReg.id ? { ...r, ...fields } : r
    );
    onUpdateConfig({ registers: updated });
  };

  // Convert default hex to 8 bits
  const activeValueInt = parseInt(activeReg?.defaultValue || '0x00', 16) || 0;
  const bitArray = Array.from({ length: 8 }, (_, idx) => {
    const bitPos = 7 - idx;
    return Boolean(activeValueInt & (1 << bitPos));
  });

  const toggleBit = (bitPos: number) => {
    if (!activeReg) return;
    const currentVal = parseInt(activeReg.defaultValue, 16) || 0;
    const newVal = currentVal ^ (1 << bitPos);
    const hexStr = `0x${newVal.toString(16).toUpperCase().padStart(2, '0')}`;
    handleUpdateActiveRegister({ defaultValue: hexStr });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            I2C Register Map Architecture
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Define registers, data lengths, signedness, and device handshake parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-slate-500">I2C Addr:</span>
            <input
              type="text"
              value={config.i2cAddressHex}
              onChange={(e) => onUpdateConfig({ i2cAddressHex: e.target.value })}
              className="w-14 bg-transparent text-cyan-400 font-bold focus:outline-none"
              placeholder="0x68"
            />
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-slate-500">Speed:</span>
            <select
              value={config.i2cBusSpeedKhz}
              onChange={(e) =>
                onUpdateConfig({ i2cBusSpeedKhz: Number(e.target.value) as 100 | 400 })
              }
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="100" className="bg-slate-900">100 kHz (Standard)</option>
              <option value="400" className="bg-slate-900">400 kHz (Fast Mode)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Register List + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Register Table */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2 px-3">Address</th>
                  <th className="py-2 px-3">Register</th>
                  <th className="py-2 px-3">Width</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {config.registers.map((reg) => {
                  const isSelected = activeReg?.id === reg.id;
                  return (
                    <tr
                      key={reg.id}
                      onClick={() => setActiveRegId(reg.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/10 text-cyan-200'
                          : 'hover:bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-cyan-400">{reg.address}</td>
                      <td className="py-2.5 px-3 font-bold">{reg.name}</td>
                      <td className="py-2.5 px-3 text-slate-400">{reg.bitWidth}-bit</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {reg.isSigned ? 'int (signed)' : 'uint (unsigned)'}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRegister(reg.id);
                          }}
                          disabled={config.registers.length <= 1}
                          className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                          title="Delete register"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Add Register Form */}
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <input
              type="text"
              value={newRegAddr}
              onChange={(e) => setNewRegAddr(e.target.value)}
              placeholder="0x10"
              className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              value={newRegName}
              onChange={(e) => setNewRegName(e.target.value)}
              placeholder="REG_NAME"
              className="flex-1 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              value={newRegDesc}
              onChange={(e) => setNewRegDesc(e.target.value)}
              placeholder="Brief description"
              className="flex-1 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleAddRegister}
              className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Right: Active Register Bitfield Inspector & Properties */}
        {activeReg && (
          <div className="lg:col-span-5 flex flex-col gap-3 p-3.5 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-slate-400">
                Register: <strong className="text-white">{activeReg.name}</strong> ({activeReg.address})
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {activeReg.defaultValue}
              </span>
            </div>

            {/* Bitfield visualizer [7..0] */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Interactive Bitfield [7:0]</span>
                <span className="text-slate-500 text-xs">Click bits to toggle</span>
              </div>
              <div className="grid grid-cols-8 gap-1 font-mono text-center">
                {[7, 6, 5, 4, 3, 2, 1, 0].map((bitNum, idx) => {
                  const isHigh = bitArray[idx];
                  return (
                    <button
                      key={bitNum}
                      type="button"
                      onClick={() => toggleBit(bitNum)}
                      className={`flex flex-col items-center py-1.5 rounded border transition-colors ${
                        isHigh
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 mb-0.5">b{bitNum}</span>
                      <span className="text-xs">{isHigh ? '1' : '0'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Width & Sign Settings */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Data Width</label>
                <select
                  value={activeReg.bitWidth}
                  onChange={(e) =>
                    handleUpdateActiveRegister({
                      bitWidth: Number(e.target.value) as 8 | 16 | 24,
                    })
                  }
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="8">8-bit Byte</option>
                  <option value="16">16-bit Word (MSB+LSB)</option>
                  <option value="24">24-bit Double-Word</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Signed / Two's Comp</label>
                <select
                  value={activeReg.isSigned ? 'signed' : 'unsigned'}
                  onChange={(e) =>
                    handleUpdateActiveRegister({
                      isSigned: e.target.value === 'signed',
                    })
                  }
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="unsigned">Unsigned (uint)</option>
                  <option value="signed">Signed (int / 2's comp)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Description / Doxygen</label>
              <input
                type="text"
                value={activeReg.description}
                onChange={(e) => handleUpdateActiveRegister({ description: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* WHO_AM_I & Hardware Verification Options */}
      <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
          <input
            type="checkbox"
            checked={config.hasWhoAmICheck}
            onChange={(e) => onUpdateConfig({ hasWhoAmICheck: e.target.checked })}
            className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
          />
          <span>Enable WHO_AM_I hardware handshake verification in <code className="text-cyan-400 font-mono">begin()</code></span>
        </label>

        {config.hasWhoAmICheck && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Reg:</span>
              <input
                type="text"
                value={config.whoAmIRegisterAddress}
                onChange={(e) => onUpdateConfig({ whoAmIRegisterAddress: e.target.value })}
                className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-800 rounded text-cyan-300"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Expected:</span>
              <input
                type="text"
                value={config.whoAmIExpectedValue}
                onChange={(e) => onUpdateConfig({ whoAmIExpectedValue: e.target.value })}
                className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-800 rounded text-cyan-300"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
