import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import ProblemForm from '../../components/admin/forms/ProblemForm';

const EditProblem = () => {
    const { id } = useParams();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const res = await api.get(`/problems/${id}`);
                setProblem(res.data.problem);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProblem();
    }, [id]);

    if (loading) return <div className="text-white p-6">Loading problem details...</div>;
    if (!problem) return <div className="text-red-500 p-6">Problem not found.</div>;

    return (
        <div className="dashboard-container">
            <ProblemForm initialData={problem} isEdit={true} />
        </div>
    );
};

export default EditProblem;
