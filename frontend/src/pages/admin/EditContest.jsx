import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ContestForm from '../../components/admin/forms/ContestForm';
import api from '../../utils/api';

const EditContest = () => {
    const { id } = useParams();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContest = async () => {
            try {
                const res = await api.get(`/contests/${id}`);
                setContest(res.data.contest);
            } catch (err) {
                console.error("Failed to fetch contest", err);
            } finally {
                setLoading(false);
            }
        };
        fetchContest();
    }, [id]);

    if (loading) return <div className="text-white p-8">Loading...</div>;
    if (!contest) return <div className="text-red-500 p-8">Contest not found.</div>;

    return (
        <div className="dashboard-container">
            <ContestForm initialData={contest} isEdit={true} />
        </div>
    );
};

export default EditContest;
