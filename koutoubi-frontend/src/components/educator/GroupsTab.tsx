'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Plus, Copy, UserPlus, School, Hash
} from 'lucide-react';
import { educatorApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  code: string;
  grade_level?: string;
  subject?: string;
  is_active: boolean;
  created_at: string;
  members_count: number;
}

export default function GroupsTab() {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grade_level: '',
    subject: ''
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await educatorApi.getStudyGroups();
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const createGroup = async () => {
    if (!formData.name) {
      toast.error('Le nom du groupe est requis');
      return;
    }

    setLoading(true);
    try {
      const response = await educatorApi.createStudyGroup(formData);
      toast.success('Groupe créé avec succès');
      setGroups([...groups, response.data]);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', grade_level: '', subject: '' });
    } catch (error) {
      toast.error('Erreur lors de la création du groupe');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié !');
  };

  if (showCreateForm) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Créer un groupe</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nom du groupe <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Maths 3ème A"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Niveau</label>
              <Input
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                placeholder="Ex: 3ème"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Matière</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ex: Mathématiques"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du groupe..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Annuler
          </Button>
          <Button onClick={createGroup} disabled={loading}>
            {loading ? 'Création...' : 'Créer'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mes groupes d'étude</h3>
          <p className="text-sm text-gray-600">Gérez vos classes et invitez des étudiants</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un groupe
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card className="p-8 text-center">
          <School className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Aucun groupe créé</p>
          <Button onClick={() => setShowCreateForm(true)}>
            Créer mon premier groupe
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <School className="h-5 w-5 text-blue-500" />
                <Badge variant={group.is_active ? 'default' : 'secondary'}>
                  {group.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              <h4 className="font-semibold mb-2">{group.name}</h4>
              {group.description && (
                <p className="text-sm text-gray-600 mb-3">{group.description}</p>
              )}

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {group.subject && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5" />
                    {group.subject}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  {group.members_count} membres
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Code d'invitation</p>
                    <p className="font-mono font-bold">{group.code}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(group.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}