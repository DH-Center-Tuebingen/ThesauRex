#!/usr/bin/python

# This script reads data from a (hardcoded) database and exports it to a skos xml/rdf file

from rdflib import Graph, Literal, BNode, Namespace, URIRef
from rdflib.namespace import RDF, RDFS, OWL, XSD, SKOS
import psycopg2
import sys
import re
import getopt

def main(argv):
    try:
        conn = psycopg2.connect("host='localhost' port='5432' dbname='thesaurusrex' user='postgres' password=''")
        cur = conn.cursor()
    except:
        print "Could not connect to database!"

    isTempTree = False
    rootId = None
    options, args = getopt.getopt(argv, 'tr:')
    for opt, arg in options:
        if opt == '-t':
            isTempTree = True
        elif opt == '-r':
            rootId = arg

    thConcept = 'th_concept'
    thLabel = 'th_concept_label'
    thBroader = 'th_concept_broader'
    if isTempTree:
        thConcept = thConcept + '_tmp'
        thLabel = thLabel + '_tmp'
        thBroader = thBroader + '_tmp'
    g = Graph()
    # TODO AnnotationProperty
    # missing namespaces
    # xmlns="http://www.w3.org/2002/07/owl#"
    # xml:base="http://www.w3.org/2002/07/owl"
    # baseNs = Namespace('http://www.w3.org/2002/07/owl#')
    #skosNs = Namespace('http://www.w3.org/2004/02/skos/core#')
    #rdfsNs = Namespace('http://www.w3.org/2000/01/rdf-schema#')
    owlNs = Namespace('http://www.w3.org/2002/07/owl#')
    #g.bind('skos', skosNs)
    #g.bind('rdfs', rdfsNs)
    g.bind('owl', owlNs)
    g.bind('', OWL)
    #g.bind('owl', OWL)
    g.bind('rdf', RDF)
    g.bind('skos', SKOS)
    g.bind('rdfs', RDFS)
    g.bind('xsd', XSD)
    conceptUrl = SKOS + "Concept"
    conceptSchemeUrl = SKOS + "ConceptScheme"
    myNs="http://thesaurus.archeoinf.de/antrophologie"
    query = "SELECT * FROM " + thConcept + ";"
    if rootId is not None:
        print ""
        # TODO recursive query
    cur.execute(query, )
    concepts = cur.fetchall()
    for c in concepts:
        cid = c[0]
        url = c[3]
        scheme = c[4]
        isTopConcept = c[6]
        if url is None:
            continue
        uUrl = URIRef(url)

        if scheme is not None:
            g.add((uUrl, SKOS['inScheme'], URIRef(scheme)))

        if isTopConcept:
            g.add((uUrl, RDF['type'], SKOS['ConceptScheme']))
            #g.add((uUrl, RDF['type'], RDF['resource']))
        else:
            g.add((uUrl, RDF['type'], SKOS['Concept']))
            #g.add((uUrl, RDF['type'], RDF['resource']))

        g.add((uUrl, RDF['type'], OWL['NamedIndividual']))

        # labels
        query = "SELECT label, concept_label_type, short_name FROM " + thLabel + " JOIN th_language ON language_id = id_th_language WHERE concept_id = %s;"
        data = (cid, )
        cur.execute(query, data)
        labels = cur.fetchall()
        for l in labels:
            label = l[0]
            labelType = l[1]
            langShort = l[2]
            if labelType == 1: #prefLabel
                g.add((uUrl, SKOS['prefLabel'], Literal(label, lang=langShort)))
            elif labelType == 2: #altLabel
                g.add((uUrl, SKOS['altLabel'], Literal(label, lang=langShort)))

        # broader
        query = "SELECT concept_url FROM " + thBroader + " JOIN " + thConcept + " ON narrower_id = id_th_concept WHERE narrower_id = %s;"
        data = (cid, )
        cur.execute(query, data)
        broaders = cur.fetchall()
        for b in broaders:
            bUrl = b[0]
            g.add((uUrl, SKOS['broader'], URIRef(bUrl)))

        # narrower
        query = "SELECT concept_url FROM " + thBroader + " JOIN " + thConcept + " ON broader_id = id_th_concept WHERE broader_id = %s;"
        data = (cid, )
        cur.execute(query, data)
        narrowers = cur.fetchall()
        for n in narrowers:
            nUrl = n[0]
            g.add((uUrl, SKOS['narrower'], URIRef(nUrl)))
    # outp="test.rdf"
    # g.serialize(destination = outp, format='pretty-xml')
    newGraph = g.serialize(format='xml')
    print newGraph

if __name__ == "__main__":
    main(sys.argv[1:])
