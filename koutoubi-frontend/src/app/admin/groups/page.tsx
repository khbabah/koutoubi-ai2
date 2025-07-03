'use client';

import { useState } from 'react';
import { useAuthenticatedSWR, useApiMutation } from '@/hooks/useApi';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Users,
  Copy,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Group {
  id: string;
  name: string;
  description?: string;
  code: string;
  group_type: string;
  is_active: boolean;
  allow_member_invites: boolean;
  require_approval: boolean;
  max_members?: number;
  member_count: number;
  created_at: string;
  created_by_id: string;
}

const GROUP_TYPES = [
  { value: 'class', label: 'Classe' },
  { value: 'school', label: 'École' },
  { value: 'study_group', label: 'Groupe d\'étude' },
  { value: 'custom', label: 'Personnalisé' }
];

export default function AdminGroupsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    group_type: 'custom',
    allow_member_invites: false,
    require_approval: false,
    max_members: undefined as number | undefined
  });
  const [page, setPage] = useState(0);
  const [limit] = useState(20);

  // Build the query string
  const queryParams = new URLSearchParams();
  queryParams.append('skip', String(page * limit));
  queryParams.append('limit', String(limit));
  if (search) queryParams.append('search', search);
  if (typeFilter !== 'all') queryParams.append('group_type', typeFilter);
  if (statusFilter !== 'all') queryParams.append('is_active', statusFilter === 'active' ? 'true' : 'false');

  // Fetch groups with SWR
  const { data: groups, error, isLoading, mutate } = useAuthenticatedSWR<Group[]>(
    `/admin/groups?${queryParams.toString()}`,
    {
      revalidateOnFocus: false,
    }
  );

  // Fetch group stats
  const { data: stats } = useAuthenticatedSWR<any>('/admin/groups/stats');

  // API mutations
  const { post, put, delete: deleteApi } = useApiMutation();

  const handleCreateGroup = async () => {
    try {
      await post('/admin/groups', newGroup);
      toast.success('Groupe créé avec succès');
      setCreateDialogOpen(false);
      setNewGroup({
        name: '',
        description: '',
        group_type: 'custom',
        allow_member_invites: false,
        require_approval: false,
        max_members: undefined
      });
      mutate();
    } catch (error) {
      // Error handled by useApiMutation
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;

    try {
      await put(`/admin/groups/${editingGroup.id}`, {
        name: editingGroup.name,
        description: editingGroup.description,
        allow_member_invites: editingGroup.allow_member_invites,
        require_approval: editingGroup.require_approval,
        max_members: editingGroup.max_members,
        is_active: editingGroup.is_active
      });
      toast.success('Groupe mis à jour avec succès');
      setEditingGroup(null);
      mutate();
    } catch (error) {
      // Error handled by useApiMutation
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      try {
        await deleteApi(`/admin/groups/${groupId}`);
        toast.success('Groupe supprimé avec succès');
        mutate();
      } catch (error) {
        // Error handled by useApiMutation
      }
    }
  };

  const copyGroupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié dans le presse-papiers');
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des groupes
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total des groupes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_groups || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Groupes actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_groups || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total des membres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_members || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Moyenne par groupe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_groups > 0 ? Math.round(stats.total_members / stats.total_groups) : 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des groupes</CardTitle>
              <CardDescription>Gérer tous les groupes de la plateforme</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => mutate()} variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un groupe
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par nom, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {GROUP_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Groups Table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Membres</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      Aucun groupe trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  groups?.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{group.name}</div>
                          {group.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {group.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                            {group.code}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyGroupCode(group.code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {GROUP_TYPES.find(t => t.value === group.group_type)?.label || group.group_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{group.member_count || 0}</span>
                          {group.max_members && (
                            <span className="text-gray-500">/ {group.max_members}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={group.is_active ? 'default' : 'secondary'}>
                          {group.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(group.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingGroup(group)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteGroup(group.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Précédent
            </Button>
            <span className="text-sm text-gray-600">Page {page + 1}</span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={!groups || groups.length < limit}
            >
              Suivant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau groupe</DialogTitle>
            <DialogDescription>
              Créer un groupe pour organiser les utilisateurs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du groupe</Label>
              <Input
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="Ex: Classe de 6ème A"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                placeholder="Description du groupe..."
              />
            </div>
            <div>
              <Label>Type de groupe</Label>
              <Select 
                value={newGroup.group_type} 
                onValueChange={(value) => setNewGroup({ ...newGroup, group_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre maximum de membres (optionnel)</Label>
              <Input
                type="number"
                value={newGroup.max_members || ''}
                onChange={(e) => setNewGroup({ 
                  ...newGroup, 
                  max_members: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Illimité"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newGroup.allow_member_invites}
                onCheckedChange={(checked) => setNewGroup({ ...newGroup, allow_member_invites: checked })}
              />
              <Label>Autoriser les membres à inviter d'autres personnes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newGroup.require_approval}
                onCheckedChange={(checked) => setNewGroup({ ...newGroup, require_approval: checked })}
              />
              <Label>Approbation requise pour rejoindre</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateGroup}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le groupe</DialogTitle>
            <DialogDescription>
              Modifier les informations du groupe
            </DialogDescription>
          </DialogHeader>
          {editingGroup && (
            <div className="space-y-4">
              <div>
                <Label>Nom du groupe</Label>
                <Input
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingGroup.description || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Nombre maximum de membres</Label>
                <Input
                  type="number"
                  value={editingGroup.max_members || ''}
                  onChange={(e) => setEditingGroup({ 
                    ...editingGroup, 
                    max_members: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingGroup.allow_member_invites}
                  onCheckedChange={(checked) => setEditingGroup({ ...editingGroup, allow_member_invites: checked })}
                />
                <Label>Autoriser les membres à inviter</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingGroup.require_approval}
                  onCheckedChange={(checked) => setEditingGroup({ ...editingGroup, require_approval: checked })}
                />
                <Label>Approbation requise</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingGroup.is_active}
                  onCheckedChange={(checked) => setEditingGroup({ ...editingGroup, is_active: checked })}
                />
                <Label>Groupe actif</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGroup(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateGroup}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}