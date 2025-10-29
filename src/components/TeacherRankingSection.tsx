import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, User, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from './ui/LoadingSpinner';
import StudentFilterSort from './ui/StudentFilterSort';

interface Student {
  id: string;
  admission_id: string;
  name: string;
  class_section: string;
  class_name: string;
  section: string;
  latest_percentage: number;
}

interface TeacherRankingSectionProps {
  teacherId: string;
  teacherClassSections: string[];
}

const TeacherRankingSection: React.FC<TeacherRankingSectionProps> = ({
  teacherId,
  teacherClassSections
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ by: string; order: 'asc' | 'desc' }>({
    by: 'latest_percentage',
    order: 'desc'
  });
  const [filters, setFilters] = useState<{
    percentageMin?: number;
    percentageMax?: number;
    nameStartsWith?: string;
    nameEndsWith?: string;
    classSection?: string;
  }>({});

  useEffect(() => {
    loadStudents();
  }, [teacherClassSections]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [students, sortConfig, filters]);

  const loadStudents = async () => {
    if (teacherClassSections.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .in('class_section', teacherClassSections)
        .order('latest_percentage', { ascending: false });

      if (error) throw error;

      if (data) {
        setStudents(data.map((s: any) => ({
          ...s,
          latest_percentage: s.latest_percentage || 0
        })));
      }
    } catch (error: any) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...students];

    if (filters.classSection) {
      filtered = filtered.filter(s => s.class_section === filters.classSection);
    }

    if (filters.percentageMin !== undefined) {
      filtered = filtered.filter(s => s.latest_percentage >= filters.percentageMin!);
    }

    if (filters.percentageMax !== undefined) {
      filtered = filtered.filter(s => s.latest_percentage <= filters.percentageMax!);
    }

    if (filters.nameStartsWith) {
      filtered = filtered.filter(s =>
        s.name.toUpperCase().startsWith(filters.nameStartsWith!)
      );
    }

    if (filters.nameEndsWith) {
      filtered = filtered.filter(s =>
        s.name.toUpperCase().endsWith(filters.nameEndsWith!)
      );
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortConfig.by) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'admission_id':
          aVal = a.admission_id?.toLowerCase() || '';
          bVal = b.admission_id?.toLowerCase() || '';
          break;
        case 'latest_percentage':
          aVal = a.latest_percentage || 0;
          bVal = b.latest_percentage || 0;
          break;
        default:
          aVal = a.latest_percentage || 0;
          bVal = b.latest_percentage || 0;
      }

      if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredStudents(filtered);
  };

  const handleSortChange = (by: string, order: 'asc' | 'desc') => {
    setSortConfig({ by, order });
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
    return 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800';
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 75) return 'text-blue-600 bg-blue-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 45) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Student Rankings
        </h2>
      </div>

      <StudentFilterSort
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        currentSort={sortConfig}
        filters={filters}
        availableClasses={teacherClassSections}
        showClassFilter={true}
      />

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No students found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student, index) => {
            const rank = index + 1;
            return (
              <div
                key={student.id}
                className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border-2 border-gray-100 hover:border-blue-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getRankBadgeColor(rank)}`}>
                    {rank <= 3 ? (
                      <Trophy className="w-6 h-6" />
                    ) : (
                      <span className="font-bold text-lg">#{rank}</span>
                    )}
                  </div>

                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {student.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-blue-600 font-medium">
                        {student.admission_id}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {student.class_section}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-xl ${getPerformanceColor(student.latest_percentage)}`}>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-2xl font-bold">
                          {student.latest_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherRankingSection;
